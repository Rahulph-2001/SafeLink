import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { EmergencySession } from '../../types/session.types';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface LiveMapProps {
  session: EmergencySession;
}

export const LiveMap = ({ session }: LiveMapProps) => {
  const latestCoords = session.latestTelemetry 
    ? [session.latestTelemetry.lat, session.latestTelemetry.lng] as [number, number]
    : [0, 0] as [number, number];

  const routePositions = session.route.map(pt => [pt.lat, pt.lng] as [number, number]);

  if (!session.latestTelemetry) {
    return (
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border border-gray-200">
        <span className="text-gray-500">Waiting for GPS signal...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-96">
      <MapContainer 
        center={latestCoords} 
        zoom={16} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {session.status === 'active' && <MapUpdater center={latestCoords} />}
        
        <Marker position={latestCoords} />
        
        {routePositions.length > 1 && (
          <Polyline 
            positions={routePositions} 
            color="#ef4444" 
            weight={4} 
            opacity={0.8} 
          />
        )}
      </MapContainer>
    </div>
  );
};
