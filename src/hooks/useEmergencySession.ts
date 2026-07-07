import { useState, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { useCanvasSnapshot } from './useCanvasSnapshot';
import { createSession, updateSessionTelemetry, endSession } from '../services/emergencyService';
import { uploadSnapshot } from '../services/storageService';
import { sendEmergencyNotifications } from '../services/notificationService';
import type { UserProfile } from '../types/user.types';

export const useEmergencySession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { telemetry, error: geoError, startWatching, stopWatching } = useGeolocation();
  const { startCapture, stopCapture, captureFrame, toggleCamera, facingMode, error: camError } = useCanvasSnapshot();

  // Use a ref to capture the latest telemetry inside the setInterval closure
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const startEmergency = async (user: UserProfile) => {
    try {
      // 1. Start hardware capture
      await startCapture();
      startWatching();

      // 2. Create DB Session
      const newSessionId = await createSession(user);
      setSessionId(newSessionId);
      setIsActive(true);

      // Send notifications to all trusted contacts
      try {
        await sendEmergencyNotifications(user, newSessionId);
      } catch (e) {
        console.error("Failed to send notifications", e);
      }

      // 3. Start snapshot upload loop (every 8 seconds)
      intervalId.current = setInterval(async () => {
        const blob = await captureFrame();
        let snapshotUrl = null;
        if (blob) {
          try {
             snapshotUrl = await uploadSnapshot(blob);
          } catch (e) {
             console.error("Failed to upload snapshot", e);
          }
        }
        
        // 4. Update Firestore with new telemetry and snapshot
        try {
          await updateSessionTelemetry(newSessionId, telemetryRef.current, snapshotUrl);
        } catch (e) {
          console.error("Failed to update telemetry", e);
        }
      }, 8000);

    } catch (error) {
      console.error("Failed to start emergency", error);
      stopEmergency();
    }
  };

  const stopEmergency = async () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    stopWatching();
    stopCapture();
    setIsActive(false);

    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch (e) {
         console.error("Failed to end session", e);
      }
      setSessionId(null);
    }
  };

  return {
    sessionId,
    isActive,
    telemetry,
    geoError,
    camError,
    startEmergency,
    stopEmergency,
    toggleCamera,
    facingMode
  };
};
