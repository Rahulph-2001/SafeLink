import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergencySession } from '../hooks/useEmergencySession';
import { EmergencyStatusBar } from '../components/emergency/EmergencyStatusBar';
import { PermissionGate } from '../components/ui/PermissionGate';
import { ShieldAlert, Video, Camera, StopCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const EmergencyPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const {
    isActive,
    telemetry,
    geoError,
    camError,
    startEmergency,
    stopEmergency,
    toggleCamera,
    facingMode
  } = useEmergencySession();

  const [startTime, setStartTime] = useState<Date | null>(null);

  const handleStart = async () => {
    if (profile) {
      setStartTime(new Date());
      await startEmergency(profile);
    }
  };

  const handleStop = async () => {
    if (window.confirm("Are you sure you want to stop the emergency broadcast?")) {
      await stopEmergency();
      navigate('/dashboard');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isActive ? 'bg-red-50' : 'bg-gray-50'}`}>
      <header className={`${isActive ? 'bg-red-600' : 'bg-white shadow'} text-white transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isActive && (
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            )}
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-8 h-8 ${isActive ? 'text-white' : 'text-emergency-600'}`} />
              <h1 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>SafeLink</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PermissionGate geoError={geoError} camError={camError}>
          
          {!isActive ? (
            <div className="flex flex-col items-center justify-center mt-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Emergency Assistant</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  SOS instantly shares your live location, camera snapshots every 8 seconds, and a video clip every 30 seconds with your trusted contacts.
                </p>
              </div>

              <button 
                onClick={handleStart}
                className="relative group flex items-center justify-center w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
              >
                <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-40"></div>
                <div className="flex flex-col items-center text-white z-10">
                  <ShieldAlert className="w-20 h-20 mb-2" />
                  <span className="text-3xl font-black tracking-widest">SOS</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <EmergencyStatusBar telemetry={telemetry} startTime={startTime || new Date()} />
              
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center flex flex-col items-center">
                <Video className="w-12 h-12 text-red-400 mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Broadcasting Live</h3>
                <p className="text-sm text-gray-500 mb-6">
                  📸 Snapshot every <strong>8 s</strong> · 🎥 Video clip every <strong>30 s</strong>
                </p>
                <button
                  onClick={toggleCamera}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera
                </button>
              </div>

              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-lg shadow-lg transition-colors"
              >
                <StopCircle className="w-6 h-6" />
                STOP EMERGENCY BROADCAST
              </button>
            </div>
          )}

        </PermissionGate>
      </main>
    </div>
  );
};
