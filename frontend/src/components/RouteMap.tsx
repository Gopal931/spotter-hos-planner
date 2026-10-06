import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map } from 'lucide-react';
import type { TripRoute } from '../types/trip';

interface RouteMapProps {
  route: TripRoute;
}

// Custom DivIcons with SVG icons for crisp, modern rendering
const createCustomIcon = (bgColor: string, text: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        border: 2px solid white;
      ">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const originIcon = createCustomIcon('#10b981', 'A');      // Emerald
const pickupIcon = createCustomIcon('#3b82f6', 'P');      // Blue
const dropoffIcon = createCustomIcon('#a855f7', 'D');     // Purple
const fuelIcon = createCustomIcon('#f59e0b', '⛽');       // Amber
const restIcon = createCustomIcon('#6366f1', '💤');       // Indigo
const breakIcon = createCustomIcon('#06b6d4', '☕');      // Cyan

// Component to adjust map view to fit route bounds
const FitBoundsHandler: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);

  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({ route }) => {
  const allCoords = [
    ...(route.leg1?.coordinates || []),
    ...(route.leg2?.coordinates || []),
  ];

  const center: [number, number] = allCoords.length > 0
    ? allCoords[Math.floor(allCoords.length / 2)]
    : [39.8283, -98.5795]; // Default center of USA

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return fuelIcon;
      case 'rest':
        return restIcon;
      case 'break':
        return breakIcon;
      case 'pickup':
        return pickupIcon;
      case 'dropoff':
        return dropoffIcon;
      default:
        return restIcon;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 m-0">
            <Map className="w-5 h-5 text-indigo-400" />
            Interactive Route & Stop Distribution Map
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real highway routing via OpenStreetMap / OSRM with plotted fuel, rest, pickup, and delivery stops
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-white inline-block"></span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-white inline-block"></span>
            <span>Dropoff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white inline-block"></span>
            <span>Fuel Stop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white inline-block"></span>
            <span>10-Hr Rest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white inline-block"></span>
            <span>30-Min Break</span>
          </div>
        </div>
      </div>

      <div className="h-[460px] w-full rounded-xl overflow-hidden border border-slate-800 relative">
        <MapContainer
          center={center}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {allCoords.length > 0 && <FitBoundsHandler coords={allCoords} />}

          {/* Leg 1 Polyline (Current -> Pickup) */}
          {route.leg1?.coordinates && (
            <Polyline
              positions={route.leg1.coordinates}
              pathOptions={{ color: '#0ea5e9', weight: 5, opacity: 0.85, lineJoin: 'round' }}
            />
          )}

          {/* Leg 2 Polyline (Pickup -> Dropoff) */}
          {route.leg2?.coordinates && (
            <Polyline
              positions={route.leg2.coordinates}
              pathOptions={{ color: '#8b5cf6', weight: 5, opacity: 0.85, lineJoin: 'round' }}
            />
          )}

          {/* Waypoints: Origin */}
          {route.waypoints?.[0] && (
            <Marker
              position={[route.waypoints[0].lat, route.waypoints[0].lng]}
              icon={originIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Current Location (Origin)</strong><br />
                  {route.waypoints[0].name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Waypoints: Pickup */}
          {route.waypoints?.[1] && (
            <Marker
              position={[route.waypoints[1].lat, route.waypoints[1].lng]}
              icon={pickupIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Pickup Location (Shipper)</strong><br />
                  {route.waypoints[1].name}<br />
                  <span className="text-blue-600 font-semibold">1.0 hr On-Duty Loading</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Waypoints: Dropoff */}
          {route.waypoints?.[2] && (
            <Marker
              position={[route.waypoints[2].lat, route.waypoints[2].lng]}
              icon={dropoffIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Dropoff Location (Receiver)</strong><br />
                  {route.waypoints[2].name}<br />
                  <span className="text-purple-600 font-semibold">1.0 hr On-Duty Unloading</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* En-route stops (Fuel, Rest, Breaks) */}
          {route.stops?.map((stop, idx) => (
            <Marker
              key={idx}
              position={[stop.lat, stop.lng]}
              icon={getStopIcon(stop.type)}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>{stop.activity}</strong><br />
                  {stop.name}<br />
                  <span className="text-slate-600">
                    Arr: {new Date(stop.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} |
                    Dep: {new Date(stop.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
