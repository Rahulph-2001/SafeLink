import { CameraOff, Image as ImageIcon } from 'lucide-react';

interface SnapshotViewerProps {
  snapshotUrl: string | null;
  isActive: boolean;
}

export const SnapshotViewer = ({ snapshotUrl, isActive }: SnapshotViewerProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          Live Camera Feed
        </h3>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-xs font-bold text-red-500">UPDATING</span>
          </div>
        )}
      </div>

      <div className="aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center relative">
        {snapshotUrl ? (
          <img 
            src={snapshotUrl} 
            alt="Live emergency snapshot" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-500 flex flex-col items-center">
            <CameraOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm">Waiting for camera feed...</span>
          </div>
        )}
      </div>
    </div>
  );
};
