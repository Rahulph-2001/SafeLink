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

  const intervalId    = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard: prevents a new cycle from starting before the previous one finishes
  const isCycleRunning = useRef(false);

  const { telemetry, error: geoError, startWatching, stopWatching } = useGeolocation();
  const {
    startCapture,
    stopCapture,
    recordClip,
    toggleCamera,
    facingMode,
    error: camError,
  } = useVideoRecorder();

  // Always expose latest telemetry inside the interval closure (stale-closure fix)
  const telemetryRef  = useRef(telemetry);
  telemetryRef.current = telemetry;

  // Keep sessionId accessible inside interval without stale closure
  const sessionIdRef  = useRef<string | null>(null);

  // ── Single clip cycle: record 20s → upload → push to Firestore ─────────────
  const runCycle = async () => {
    // Skip if a previous cycle is still in progress (upload took > 10s on slow net)
    if (isCycleRunning.current) {
      console.warn('[Emergency] Previous cycle still running — skipping this tick');
      return;
    }
    if (!sessionIdRef.current) return;

    isCycleRunning.current = true;
    try {
      console.log('[Emergency] Starting 20s recording…');
      const blob = await recordClip();           // waits ~20 s

      let mediaUrl: string | null = null;
      if (blob) {
        try {
          mediaUrl = await uploadSnapshot(blob); // upload to Cloudinary
        } catch (e) {
          console.error('[Emergency] Upload failed:', e);
        }
      } else {
        console.warn('[Emergency] recordClip returned null — nothing to upload');
      }

      // Push telemetry + media URL to Firestore (even if mediaUrl is null)
      try {
        await updateSessionTelemetry(
          sessionIdRef.current,
          telemetryRef.current,
          mediaUrl
        );
      } catch (e) {
        console.error('[Emergency] Firestore update failed:', e);
      }
    } finally {
      isCycleRunning.current = false;
    }
  };

  // ── Start emergency ─────────────────────────────────────────────────────────
  const startEmergency = async (user: UserProfile) => {
    try {
      // 1. Start camera (front camera first)
      await startCapture('user');
      startWatching();

      // 2. Create Firestore session
      const newSessionId = await createSession(user);
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      setIsActive(true);

      // 3. Notify trusted contacts
      try {
        await sendEmergencyNotifications(user, newSessionId);
      } catch (e) {
        console.error('[Emergency] Notification failed:', e);
      }

      // 4. Run first cycle immediately, then repeat every CYCLE_INTERVAL_MS (30s)
      //    Each cycle: records for RECORD_DURATION_MS (20s), uploads, updates Firestore
      //    Leaving a ~10s gap before the next cycle starts (30 - 20 = 10s rest)
      runCycle();
      intervalId.current = setInterval(runCycle, CYCLE_INTERVAL_MS);

    } catch (error) {
      console.error('[Emergency] Failed to start:', error);
      stopEmergency();
    }
  };

  // ── Stop emergency ──────────────────────────────────────────────────────────
  const stopEmergency = async () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    isCycleRunning.current = false;
    stopWatching();
    stopCapture();
    setIsActive(false);

    const sid = sessionIdRef.current;
    if (sid) {
      try {
        await endSession(sid);
      } catch (e) {
        console.error('[Emergency] Failed to end session:', e);
      }
      sessionIdRef.current = null;
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
