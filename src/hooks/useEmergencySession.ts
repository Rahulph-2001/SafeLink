import { useState, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { useVideoRecorder, CYCLE_INTERVAL_MS } from './useVideoRecorder';
import { createSession, updateSessionTelemetry, endSession } from '../services/emergencyService';
import { uploadSnapshot } from '../services/storageService';
import { sendEmergencyNotifications } from '../services/notificationService';
import type { UserProfile } from '../types/user.types';

export const useEmergencySession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive,  setIsActive]  = useState(false);

  // Interval ref — one interval drives the 30-second cycle
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  const { telemetry, error: geoError, startWatching, stopWatching } = useGeolocation();
  const {
    startCapture,
    stopCapture,
    recordClip,
    toggleCamera,
    facingMode,
    error: camError,
  } = useVideoRecorder();

  // Keep latest telemetry accessible inside the interval closure (stale-closure fix)
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  // ── Start emergency ──────────────────────────────────────────────────────────
  const startEmergency = async (user: UserProfile) => {
    try {
      // 1. Start hardware capture (front camera by default)
      await startCapture('user');
      startWatching();

      // 2. Create Firestore session
      const newSessionId = await createSession(user);
      setSessionId(newSessionId);
      setIsActive(true);

      // 3. Notify contacts
      try {
        await sendEmergencyNotifications(user, newSessionId);
      } catch (e) {
        console.error('Failed to send notifications', e);
      }

      // 4. Start the 30-second video clip cycle
      //    Each tick:  record 20s → upload → update telemetry
      //    The interval fires every CYCLE_INTERVAL_MS (30s), so the 10s gap
      //    between the end of recording and the next tick acts as the "rest" period.
      const runCycle = async () => {
        // Record a 20-second video clip
        const blob = await recordClip();

        let videoUrl: string | null = null;
        if (blob) {
          try {
            videoUrl = await uploadSnapshot(blob);
          } catch (e) {
            console.error('Failed to upload video clip', e);
          }
        }

        // Push latest telemetry + video URL to Firestore
        try {
          await updateSessionTelemetry(newSessionId, telemetryRef.current, videoUrl);
        } catch (e) {
          console.error('Failed to update telemetry', e);
        }
      };

      // Kick off first cycle immediately, then repeat every 30s
      runCycle();
      intervalId.current = setInterval(runCycle, CYCLE_INTERVAL_MS);

    } catch (error) {
      console.error('Failed to start emergency', error);
      stopEmergency();
    }
  };

  // ── Stop emergency ───────────────────────────────────────────────────────────
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
        console.error('Failed to end session', e);
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
    facingMode,
  };
};
