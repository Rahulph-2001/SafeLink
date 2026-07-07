import type { TelemetryData } from '../../types/telemetry.types';
import { Battery, Navigation, Activity, Clock } from 'lucide-react';
import { formatTimeElapsed } from '../../utils/geoUtils';

interface EmergencyStatusBarProps {
  telemetry: Partial<TelemetryData>;
  startTime: Date;
}

export const EmergencyStatusBar = ({ telemetry, startTime }: EmergencyStatusBarProps) => {
  const speedKmh = telemetry.speed ? (telemetry.speed * 3.6).toFixed(1) : '0.0';
  const timeElapsed = formatTimeElapsed(startTime, new Date()); 
  
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <span className="font-bold text-red-500 tracking-wider">LIVE</span>
        </div>
        <div className="text-sm font-mono text-gray-300">
          Session Active
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Activity className="w-3 h-3"/> SPEED</span>
          <span className="font-mono text-lg">{speedKmh} <span className="text-sm text-gray-500">km/h</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Battery className="w-3 h-3"/> BATTERY</span>
          <span className="font-mono text-lg">{telemetry.battery !== null && telemetry.battery !== undefined ? telemetry.battery : '--'} <span className="text-sm text-gray-500">%</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Navigation className="w-3 h-3"/> HEADING</span>
          <span className="font-mono text-lg">{telemetry.heading !== null && telemetry.heading !== undefined ? Math.round(telemetry.heading) : '--'} <span className="text-sm text-gray-500">°</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> ELAPSED</span>
          <span className="font-mono text-lg">{timeElapsed}</span>
        </div>
      </div>
    </div>
  );
};
