import { CameraOff, Video as VideoIcon } from 'lucide-react';

interface SnapshotViewerProps {
  /** Cloudinary URL of the latest video clip (or null while waiting) */
  snapshotUrl: string | null;
  isActive: boolean;
}

export const SnapshotViewer = ({ snapshotUrl, isActive }: SnapshotViewerProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-gray-500" />
          Live Video Feed
        </h3>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs font-bold text-red-500">RECORDING</span>
          </div>
        )}
      </div>

      <div className="aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center relative">
        {snapshotUrl ? (
          <video
            key={snapshotUrl}          /* remount whenever a new clip arrives */
            src={snapshotUrl}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-500 flex flex-col items-center">
            <CameraOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm">Waiting for video clip…</span>
            {isActive && (
              <span className="text-xs text-gray-400 mt-1">
                First clip arrives after 20 s
              </span>
            )}
          </div>
        )}
      </div>

      {snapshotUrl && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          20-second clip · auto-refreshes every 30 s
        </p>
      )}
    </div>
  );
};
