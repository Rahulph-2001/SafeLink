import { useState, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { useVideoRecorder, IMAGE_INTERVAL_MS, RECORD_DURATION_MS, CYCLE_INTERVAL_MS } from './useVideoRecorder';
import { createSession, updateSessionTelemetry, endSession } from '../services/emergencyService';
import { uploadSnapshot } from '../services/storageService';
import { sendEmergencyNotifications } from '../services/notificationService';
import type { UserProfile } from '../types/user.types';

export const useEmergencySession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive,  setIsActive]  = useState(false);

  const imageIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVideoCycleRunning = useRef(false);

  const { telemetry, error: geoError, startWatching, stopWatching } = useGeolocation();
  const {
    startCapture,
    stopCapture,
    captureImage,
    recordClip,
    toggleCamera,
    facingMode,
    error: camError,
  } = useVideoRecorder();

  // Always expose latest telemetry to interval closures
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const sessionIdRef = useRef<string | null>(null);

  // ── Image cycle: capture JPEG every 8s ─────────────────────────────────────
  const runImageCycle = async () => {
    if (!sessionIdRef.current) return;
    try {
      const blob = await captureImage();
      if (!blob) { console.warn('[Image] captureImage returned null'); return; }

      const imageUrl = await uploadSnapshot(blob);
      await updateSessionTelemetry(sessionIdRef.current, telemetryRef.current, imageUrl);
      console.log('[Image] ✅ Snapshot uploaded & telemetry updated');
    } catch (e) {
      console.error('[Image] Cycle failed:', e);
    }
  };

  // ── Video cycle: record 20s every 30s ──────────────────────────────────────
  const runVideoCycle = async () => {
    if (!sessionIdRef.current) return;
    if (isVideoCycleRunning.current) {
      console.warn('[Video] Previous cycle still running — skipping tick');
      return;
    }
    isVideoCycleRunning.current = true;
    try {
      console.log('[Video] Starting 20s recording…');
      const blob = await recordClip();
      if (!blob) { console.warn('[Video] recordClip returned null'); return; }

      const videoUrl = await uploadSnapshot(blob);
      await updateSessionTelemetry(sessionIdRef.current, telemetryRef.current, videoUrl);
      console.log('[Video] ✅ Clip uploaded & telemetry updated');
    } catch (e) {
      console.error('[Video] Cycle failed:', e);
    } finally {
      isVideoCycleRunning.current = false;
    }
  };

  // ── Start emergency ─────────────────────────────────────────────────────────
  const startEmergency = async (user: UserProfile) => {
    try {
      // 1. Open camera (front cam first)
      await startCapture('user');
      startWatching();

      // 2. Create Firestore session
      const newSessionId = await createSession(user);
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      setIsActive(true);

      // 3. Notify contacts
      try {
        await sendEmergencyNotifications(user, newSessionId);
      } catch (e) {
        console.error('[Emergency] Notification failed:', e);
      }

      // 4a. IMAGE loop — runs immediately, then every 8s
      runImageCycle();
      imageIntervalId.current = setInterval(runImageCycle, IMAGE_INTERVAL_MS);

      // 4b. VIDEO loop — first clip after RECORD_DURATION_MS delay
      //     (gives camera time to warm up), then every 30s
      setTimeout(() => {
        runVideoCycle();
        videoIntervalId.current = setInterval(runVideoCycle, CYCLE_INTERVAL_MS);
      }, RECORD_DURATION_MS); // start first video cycle after 20s

    } catch (error) {
      console.error('[Emergency] Failed to start:', error);
      stopEmergency();
    }
  };

  // ── Stop emergency ──────────────────────────────────────────────────────────
  const stopEmergency = async () => {
    if (imageIntervalId.current) {
      clearInterval(imageIntervalId.current);
      imageIntervalId.current = null;
    }
    if (videoIntervalId.current) {
      clearInterval(videoIntervalId.current);
      videoIntervalId.current = null;
    }
    isVideoCycleRunning.current = false;
    stopWatching();
    stopCapture();
    setIsActive(false);

    const sid = sessionIdRef.current;
    if (sid) {
      try { await endSession(sid); } catch (e) {
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
