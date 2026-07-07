import type { EmergencySession } from '../../types/session.types';
import { Battery, Navigation, Activity, Clock } from 'lucide-react';
import { formatTimeElapsed } from '../../utils/geoUtils';

interface TelemetryPanelProps {
  session: EmergencySession;
}

export const TelemetryPanel = ({ session }: TelemetryPanelProps) => {
  const telemetry = session.latestTelemetry;
  
  const speedKmh = telemetry?.speed ? (telemetry.speed * 3.6).toFixed(1) : '0.0';
  const endTime = session.endedAt || new Date();
  const timeElapsed = formatTimeElapsed(session.startedAt, endTime);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Telemetry Data</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Activity className="w-4 h-4"/> Speed</span>
          <span className="font-mono text-xl text-gray-900">{speedKmh} <span className="text-sm text-gray-500">km/h</span></span>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Battery className="w-4 h-4"/> Battery</span>
          <span className="font-mono text-xl text-gray-900">{telemetry?.battery !== null && telemetry?.battery !== undefined ? telemetry.battery : '--'} <span className="text-sm text-gray-500">%</span></span>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Navigation className="w-4 h-4"/> Heading</span>
          <span className="font-mono text-xl text-gray-900">{telemetry?.heading !== null && telemetry?.heading !== undefined ? Math.round(telemetry.heading) : '--'} <span className="text-sm text-gray-500">°</span></span>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Clock className="w-4 h-4"/> Duration</span>
          <span className="font-mono text-xl text-gray-900">{timeElapsed}</span>
        </div>
      </div>
    </div>
  );
};
