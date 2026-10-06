import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TripRoute } from '../../types/trip';

interface RouteMapProps {
  route: TripRoute;
}

// Crisp, professional SVG DivIcons for Leaflet
const createMarkerIcon = (bgColor: string, text: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background-color: ${bgColor};
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
          border: 1.5px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span>${text}</span>
          <span style="font-size: 10px; font-weight: 500; opacity: 0.9;">${label}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${bgColor};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
};

const startIcon = createMarkerIcon('#059669', 'START', 'Origin');
const pickupIcon = createMarkerIcon('#2563eb', 'PICKUP', 'Shipper');
const dropoffIcon = createMarkerIcon('#7c3aed', 'DROP', 'Receiver');
const fuelIcon = createMarkerIcon('#d97706', 'FUEL', 'Stop');
const restIcon = createMarkerIcon('#475569', 'REST', '10h Reset');
const breakIcon = createMarkerIcon('#0284c7', 'BREAK', '30m');

// Auto-fit bounds handler
const BoundsHandler: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
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
    : [39.8283, -98.5795];

  const getStopMarkerIcon = (type: string) => {
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
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Trip Route
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real highway routing via OpenStreetMap / OSRM with fuel and rest stop intervals.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span className="text-[11px] font-medium">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-[11px] font-medium">Pickup (1h Load)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
            <span className="text-[11px] font-medium">Fuel Stop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
            <span className="text-[11px] font-medium">30m Break</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
            <span className="text-[11px] font-medium">10h Rest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
            <span className="text-[11px] font-medium">Dropoff (1h Unload)</span>
          </div>
        </div>
      </div>

      {/* Large spacious Map Viewport */}
      <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
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

          {allCoords.length > 0 && <BoundsHandler coords={allCoords} />}

          {/* Leg 1 Polyline */}
          {route.leg1?.coordinates && (
            <Polyline
              positions={route.leg1.coordinates}
              pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85, lineJoin: 'round' }}
            />
          )}

          {/* Leg 2 Polyline */}
          {route.leg2?.coordinates && (
            <Polyline
              positions={route.leg2.coordinates}
              pathOptions={{ color: '#7c3aed', weight: 5, opacity: 0.85, lineJoin: 'round' }}
            />
          )}

          {/* Start Marker */}
          {route.waypoints?.[0] && (
            <Marker
              position={[route.waypoints[0].lat, route.waypoints[0].lng]}
              icon={startIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Current Location (Start)</strong><br />
                  {route.waypoints[0].name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pickup Marker */}
          {route.waypoints?.[1] && (
            <Marker
              position={[route.waypoints[1].lat, route.waypoints[1].lng]}
              icon={pickupIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Pickup Location</strong><br />
                  {route.waypoints[1].name}<br />
                  <span className="text-blue-600 font-semibold">1.0 hr On-Duty Loading</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dropoff Marker */}
          {route.waypoints?.[2] && (
            <Marker
              position={[route.waypoints[2].lat, route.waypoints[2].lng]}
              icon={dropoffIcon}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>Dropoff Location</strong><br />
                  {route.waypoints[2].name}<br />
                  <span className="text-purple-600 font-semibold">1.0 hr On-Duty Unloading</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Fuel, Rest, and Break stops */}
          {route.stops?.map((stop, idx) => (
            <Marker
              key={idx}
              position={[stop.lat, stop.lng]}
              icon={getStopMarkerIcon(stop.type)}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <strong>{stop.activity}</strong><br />
                  {stop.name}<br />
                  <span className="text-slate-500">
                    Arrival: {new Date(stop.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
