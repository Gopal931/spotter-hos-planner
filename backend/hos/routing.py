"""
Routing and Geocoding Service for Spotter HOS Trip Planner.
Integrates with OpenStreetMap Nominatim and OSRM (Open Source Routing Machine),
with a resilient offline fallback dictionary and geodesic interpolation for maximum reliability.
"""

import math
import logging
import requests
from typing import Tuple, List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fallback geocoding coordinates for major US cities to ensure zero failure
COMMON_US_LOCATIONS: Dict[str, Tuple[float, float, str]] = {
    "new york, ny": (40.7128, -74.0060, "New York, NY, USA"),
    "new york": (40.7128, -74.0060, "New York, NY, USA"),
    "nyc": (40.7128, -74.0060, "New York, NY, USA"),
    "philadelphia, pa": (39.9526, -75.1652, "Philadelphia, PA, USA"),
    "philadelphia": (39.9526, -75.1652, "Philadelphia, PA, USA"),
    "chicago, il": (41.8781, -87.6298, "Chicago, IL, USA"),
    "chicago": (41.8781, -87.6298, "Chicago, IL, USA"),
    "los angeles, ca": (34.0522, -118.2437, "Los Angeles, CA, USA"),
    "los angeles": (34.0522, -118.2437, "Los Angeles, CA, USA"),
    "phoenix, az": (33.4484, -112.0740, "Phoenix, AZ, USA"),
    "phoenix": (33.4484, -112.0740, "Phoenix, AZ, USA"),
    "dallas, tx": (32.7767, -96.7970, "Dallas, TX, USA"),
    "dallas": (32.7767, -96.7970, "Dallas, TX, USA"),
    "houston, tx": (29.7604, -95.3698, "Houston, TX, USA"),
    "houston": (29.7604, -95.3698, "Houston, TX, USA"),
    "atlanta, ga": (33.7490, -84.3880, "Atlanta, GA, USA"),
    "atlanta": (33.7490, -84.3880, "Atlanta, GA, USA"),
    "miami, fl": (25.7617, -80.1918, "Miami, FL, USA"),
    "miami": (25.7617, -80.1918, "Miami, FL, USA"),
    "seattle, wa": (47.6062, -122.3321, "Seattle, WA, USA"),
    "seattle": (47.6062, -122.3321, "Seattle, WA, USA"),
    "denver, co": (39.7392, -104.9903, "Denver, CO, USA"),
    "denver": (39.7392, -104.9903, "Denver, CO, USA"),
    "boston, ma": (42.3601, -71.0589, "Boston, MA, USA"),
    "boston": (42.3601, -71.0589, "Boston, MA, USA"),
    "columbus, oh": (39.9612, -82.9988, "Columbus, OH, USA"),
    "columbus": (39.9612, -82.9988, "Columbus, OH, USA"),
    "indianapolis, in": (39.7684, -86.1581, "Indianapolis, IN, USA"),
    "indianapolis": (39.7684, -86.1581, "Indianapolis, IN, USA"),
    "pittsburgh, pa": (40.4406, -79.9959, "Pittsburgh, PA, USA"),
    "pittsburgh": (40.4406, -79.9959, "Pittsburgh, PA, USA"),
    "cleveland, oh": (41.4993, -81.6944, "Cleveland, OH, USA"),
    "cleveland": (41.4993, -81.6944, "Cleveland, OH, USA"),
    "detroit, mi": (42.3314, -83.0458, "Detroit, MI, USA"),
    "detroit": (42.3314, -83.0458, "Detroit, MI, USA"),
    "kansas city, mo": (39.0997, -94.5786, "Kansas City, MO, USA"),
    "kansas city": (39.0997, -94.5786, "Kansas City, MO, USA"),
    "st louis, mo": (38.6270, -90.1994, "St. Louis, MO, USA"),
    "st. louis, mo": (38.6270, -90.1994, "St. Louis, MO, USA"),
    "memphis, tn": (35.1495, -90.0490, "Memphis, TN, USA"),
    "nashville, tn": (36.1627, -86.7816, "Nashville, TN, USA"),
    "charlotte, nc": (35.2271, -80.8431, "Charlotte, NC, USA"),
    "salt lake city, ut": (40.7608, -111.8910, "Salt Lake City, UT, USA"),
    "san francisco, ca": (37.7749, -122.4194, "San Francisco, CA, USA"),
    "san diego, ca": (32.7157, -117.1611, "San Diego, CA, USA"),
    "las vegas, nv": (36.1699, -115.1398, "Las Vegas, NV, USA"),
}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"


def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in statute miles."""
    r = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def geocode_location(query: str) -> Dict[str, Any]:
    """
    Geocodes a location name to lat, lng, and formatted display name.
    Attempts Nominatim first; falls back to internal dictionary or estimated US bounds.
    """
    clean_query = query.strip()
    lower_query = clean_query.lower()

    # 1. Check exact or partial match in common US locations
    if lower_query in COMMON_US_LOCATIONS:
        lat, lng, name = COMMON_US_LOCATIONS[lower_query]
        return {"name": clean_query, "display_name": name, "lat": lat, "lng": lng}

    for key, val in COMMON_US_LOCATIONS.items():
        if key in lower_query or lower_query in key:
            return {"name": clean_query, "display_name": val[2], "lat": val[0], "lng": val[1]}

    # 2. Try Nominatim Geocoder
    headers = {"User-Agent": "SpotterHOSTripPlanner/1.0 (contact: support@spotter-hos.local)"}
    params = {"q": clean_query, "format": "json", "limit": 1, "countrycodes": "us,ca,mx"}

    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=4.0)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                display = data[0].get("display_name", clean_query)
                return {"name": clean_query, "display_name": display, "lat": lat, "lng": lng}
    except Exception as e:
        logger.warning(f"Nominatim geocoding failed for '{query}': {e}")

    # 3. Fallback: Default to a central geographic point or raise ValueError
    raise ValueError(f"Could not find coordinates for location: '{clean_query}'. Please provide a valid city and state (e.g., 'Chicago, IL').")


def get_route_between(lat1: float, lon1: float, lat2: float, lon2: float) -> Dict[str, Any]:
    """
    Fetches real-world driving route and polyline geometry using OSRM.
    Falls back to interpolated great-circle routing if OSRM is unreachable.
    """
    url = OSRM_ROUTE_URL.format(lon1=lon1, lat1=lat1, lon2=lon2, lat2=lat2)
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        response = requests.get(url, params=params, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if data.get("routes") and len(data["routes"]) > 0:
                best_route = data["routes"][0]
                # OSRM returns distance in meters, duration in seconds
                distance_meters = best_route["distance"]
                duration_seconds = best_route["duration"]
                distance_miles = round(distance_meters * 0.000621371, 1)

                # For commercial trucks, average highway speed is capped lower than cars (~55-60 mph)
                # If OSRM duration implies speed > 62 mph, calibrate to realistic truck speed
                car_duration_hours = duration_seconds / 3600.0
                truck_speed_mph = 55.0
                truck_duration_hours = max(car_duration_hours * 1.15, distance_miles / truck_speed_mph)
                truck_duration_hours = round(truck_duration_hours, 2)

                raw_coords = best_route["geometry"]["coordinates"]
                # Convert [lon, lat] to [lat, lon]
                lat_lng_coords = [[pt[1], pt[0]] for pt in raw_coords]

                return {
                    "distance_miles": distance_miles,
                    "duration_hours": truck_duration_hours,
                    "coordinates": lat_lng_coords,
                }
    except Exception as e:
        logger.warning(f"OSRM routing failed: {e}. Falling back to geometric highway model.")

    # Geometric fallback with highway curvature factor (1.25x haversine)
    straight_miles = haversine_distance_miles(lat1, lon1, lat2, lon2)
    highway_miles = round(straight_miles * 1.25, 1)
    duration_hours = round(highway_miles / 55.0, 2)

    # Generate 50 intermediate points for smooth polyline display
    steps = 50
    coords = []
    for i in range(steps + 1):
        fraction = i / steps
        inter_lat = round(lat1 + (lat2 - lat1) * fraction, 5)
        inter_lon = round(lon1 + (lon2 - lon1) * fraction, 5)
        coords.append([inter_lat, inter_lon])

    return {
        "distance_miles": highway_miles,
        "duration_hours": duration_hours,
        "coordinates": coords,
    }


def interpolate_stop_coordinates(route_coords: List[List[float]], target_ratio: float) -> Tuple[float, float]:
    """
    Interpolates a coordinate along a polyline based on target_ratio (0.0 to 1.0).
    """
    if not route_coords:
        return 0.0, 0.0
    if target_ratio <= 0.0:
        return route_coords[0][0], route_coords[0][1]
    if target_ratio >= 1.0:
        return route_coords[-1][0], route_coords[-1][1]

    idx = int(target_ratio * (len(route_coords) - 1))
    idx = max(0, min(len(route_coords) - 1, idx))
    return route_coords[idx][0], route_coords[idx][1]
