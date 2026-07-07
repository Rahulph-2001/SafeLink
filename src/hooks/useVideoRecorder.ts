import { useState, useRef, useCallback } from 'react';

// ─── Timing constants (exported so useEmergencySession can import them) ────────
export const RECORD_DURATION_MS = 20_000; // record 20 s per clip
export const CYCLE_INTERVAL_MS  = 30_000; // start a new clip every 30 s

// ─── Best supported MIME type ─────────────────────────────────────────────────
const getSupportedMime = (): string => {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    '',
  ];
  return candidates.find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? '';
};

export const useVideoRecorder = () => {
  const [error, setError]           = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Cleanly stop any active recorder without destroying the stream */
  const stopActiveRecorder = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch (_) {}
    }
    recorderRef.current = null;
  };

  // ── Start camera stream ────────────────────────────────────────────────────
  const startCapture = useCallback(async (mode: 'environment' | 'user' = 'user') => {
    try {
      // Stop recorder first so it doesn't reference the dying stream
      stopActiveRecorder();

      // Stop old stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width:  { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setFacingMode(mode);
      setError(null);
    } catch (err: any) {
      const msg = err.message || 'Camera access denied';
      console.error('startCapture failed:', msg);
      setError(msg);
    }
  }, []);

  // ── Stop everything ────────────────────────────────────────────────────────
  const stopCapture = useCallback(() => {
    stopActiveRecorder();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Record one clip of RECORD_DURATION_MS and return its Blob ─────────────
  const recordClip = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        console.warn('recordClip: no active stream — skipping');
        resolve(null);
        return;
      }

      // If a previous recorder is still running, stop it first
      stopActiveRecorder();

      const mimeType = getSupportedMime();
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(
          streamRef.current,
          mimeType ? { mimeType } : undefined
        );
      } catch (e) {
        console.error('MediaRecorder init failed:', e);
        resolve(null);
        return;
      }

      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        // FIX: timeslice of 1000ms guarantees data arrives even on mobile
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        recorderRef.current = null;
        if (chunks.length === 0) {
          console.warn('recordClip: no data chunks collected');
          resolve(null);
          return;
        }
        const finalMime = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        console.log(`recordClip: captured ${(blob.size / 1024).toFixed(1)} KB [${finalMime}]`);
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.onerror = (e: Event) => {
        console.error('MediaRecorder error:', e);
        recorderRef.current = null;
        resolve(null);
      };

      // FIX: pass timeslice (1000 ms) so ondataavailable fires every second
      recorder.start(1000);

      // Auto-stop after recording window
      setTimeout(() => {
        if (recorderRef.current && recorder.state === 'recording') {
          recorder.stop();
        }
      }, RECORD_DURATION_MS);
    });
  }, []);

  // ── Toggle front ↔ back (safe — stops recorder before switching stream) ───
  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    // startCapture already calls stopActiveRecorder before touching the stream
    startCapture(newMode);
  }, [facingMode, startCapture]);

  return {
    error,
    facingMode,
    startCapture,
    stopCapture,
    recordClip,
    toggleCamera,
    streamRef,
  };
};
