import { useState, useRef, useCallback } from 'react';

// ─── Timing constants ──────────────────────────────────────────────────────────
export const RECORD_DURATION_MS = 20_000; // record for 20 seconds
export const CYCLE_INTERVAL_MS  = 30_000; // new clip every 30 seconds

// ─── Best supported MIME type ─────────────────────────────────────────────────
const getSupportedMime = (): string => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
};

export const useVideoRecorder = () => {
  const [error, setError]           = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

  // Refs — avoids stale closures inside intervals
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // ── Start camera stream ────────────────────────────────────────────────────
  const startCapture = useCallback(async (mode: 'environment' | 'user' = 'user') => {
    try {
      // Tear down any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width:  { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720  },
        },
        audio: false,
      });

      streamRef.current = stream;
      setFacingMode(mode);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  }, []);

  // ── Stop camera stream ─────────────────────────────────────────────────────
  const stopCapture = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Record exactly RECORD_DURATION_MS of video, return Blob ───────────────
  const recordClip = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        console.warn('recordClip: no active stream');
        resolve(null);
        return;
      }

      const mimeType = getSupportedMime();
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      } catch (e) {
        console.error('MediaRecorder init failed:', e);
        resolve(null);
        return;
      }

      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        recorderRef.current = null;
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        recorderRef.current = null;
        resolve(null);
      };

      recorder.start();

      // Auto-stop after the recording window
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, RECORD_DURATION_MS);
    });
  }, []);

  // ── Toggle front ↔ back camera ────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCapture(newMode);
  }, [facingMode, startCapture]);

  return {
    error,
    facingMode,
    startCapture,
    stopCapture,
    recordClip,
    toggleCamera,
    streamRef, // exposed so EmergencyPage can show a live preview if needed
  };
};
