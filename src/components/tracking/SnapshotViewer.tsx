import { CameraOff, Video as VideoIcon, Camera } from 'lucide-react';

interface SnapshotViewerProps {
  /** Cloudinary URL — can be an image (jpg) or video (webm/mp4) */
  snapshotUrl: string | null;
  isActive: boolean;
}

/** Detect if the Cloudinary URL points to a video resource */
const isVideoUrl = (url: string): boolean =>
  url.includes('/video/upload/') ||
  url.endsWith('.webm') ||
  url.endsWith('.mp4') ||
  url.includes('video_');

export const SnapshotViewer = ({ snapshotUrl, isActive }: SnapshotViewerProps) => {
  const showVideo = snapshotUrl ? isVideoUrl(snapshotUrl) : false;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          {showVideo
            ? <VideoIcon className="w-5 h-5 text-red-500" />
            : <Camera className="w-5 h-5 text-gray-500" />
          }
          {showVideo ? 'Live Video Clip' : 'Live Camera Feed'}
        </h3>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs font-bold text-red-500">
              {showVideo ? 'RECORDING' : 'LIVE'}
            </span>
          </div>
        )}
      </div>

      {/* Media area */}
      <div className="aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center relative">
        {snapshotUrl ? (
          showVideo ? (
            <video
              key={snapshotUrl}
              src={snapshotUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              key={snapshotUrl}
              src={snapshotUrl}
              alt="Live emergency snapshot"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <CameraOff className="w-10 h-10 opacity-40" />
            <span className="text-sm">Waiting for camera feed…</span>
            {isActive && (
              <span className="text-xs text-gray-400">
                First image arrives within 8 s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {snapshotUrl && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          {showVideo
            ? '20-second video clip · refreshes every 30 s'
            : 'Live snapshot · refreshes every 8 s'}
        </p>
      )}
    </div>
  );
};
