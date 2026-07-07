import { useParams, Link } from 'react-router-dom';
import { useResponderFeed } from '../hooks/useResponderFeed';
import { LiveMap } from '../components/tracking/LiveMap';
import { SnapshotViewer } from '../components/tracking/SnapshotViewer';
import { TelemetryPanel } from '../components/tracking/TelemetryPanel';
import { ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';

export const TrackingPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, loading, error } = useResponderFeed(sessionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emergency-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Connecting to secure live feed...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error || 'Session not found'}</p>
          <Link to="/dashboard" className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-black transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'active';

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className={`${isActive ? 'bg-red-600' : 'bg-gray-800'} text-white shadow-md transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white hover:text-gray-200 opacity-80">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-bold leading-tight">SafeLink Responder Feed</h1>
                <p className="text-xs opacity-90">{isActive ? 'LIVE EMERGENCY' : 'Session Ended'}</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-medium">Victim: {session.userName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!isActive && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>This emergency session has ended.</strong> You are viewing historical tracking data.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LiveMap session={session} />
          </div>
          
          <div className="space-y-6">
            <SnapshotViewer snapshotUrl={session.currentSnapshotUrl} isActive={isActive} />
            <TelemetryPanel session={session} />
          </div>
        </div>
      </main>
    </div>
  );
};
