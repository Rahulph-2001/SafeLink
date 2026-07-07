import { useState, useRef, useCallback } from 'react';

// ─── Timing constants ──────────────────────────────────────────────────────────
export const IMAGE_INTERVAL_MS  =  8_000; // snapshot every 8 s
export const RECORD_DURATION_MS = 20_000; // video clip length
export const CYCLE_INTERVAL_MS  = 30_000; // video cycle period

// ─── Best supported video MIME ────────────────────────────────────────────────
const getSupportedMime = (): string => {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4', ''];
  return candidates.find((m) => !m || MediaRecorder.isTypeSupported(m)) ?? '';
};

export const useVideoRecorder = () => {
  const [error, setError]           = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

  const streamRef      = useRef<MediaStream | null>(null);
  const recorderRef    = useRef<MediaRecorder | null>(null);

  // Dedicated video element + canvas for image snapshots (reused, not recreated each call)
  const snapVideoRef   = useRef<HTMLVideoElement | null>(null);
  const snapCanvasRef  = useRef<HTMLCanvasElement | null>(null);

  // ── Internal: stop recorder gracefully ────────────────────────────────────
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
      stopActiveRecorder();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Detach old stream from the snapshot video element
      if (snapVideoRef.current) {
        snapVideoRef.current.srcObject = null;
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

      // Immediately attach to snapshot video element so it's ready for captureImage()
      if (!snapVideoRef.current) {
        snapVideoRef.current = document.createElement('video');
        snapVideoRef.current.autoplay    = true;
        snapVideoRef.current.muted       = true;
        snapVideoRef.current.playsInline = true;
      }
      snapVideoRef.current.srcObject = stream;
      await snapVideoRef.current.play().catch((e) =>
        console.warn('Snapshot video autoplay blocked:', e)
      );
    } catch (err: any) {
      const msg = err.message || 'Camera access denied';
      console.error('[Camera] startCapture failed:', msg);
      setError(msg);
    }
  }, []);

  // ── Stop everything ────────────────────────────────────────────────────────
  const stopCapture = useCallback(() => {
    stopActiveRecorder();
    if (snapVideoRef.current) {
      snapVideoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Capture a single JPEG image frame from the live stream ─────────────────
  const captureImage = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = snapVideoRef.current;

      if (!video || !streamRef.current) {
        console.warn('[captureImage] No video element or stream — skipping');
        resolve(null);
        return;
      }

      const doCapture = () => {
        if (!snapCanvasRef.current) {
          snapCanvasRef.current = document.createElement('canvas');
        }
        const w = video.videoWidth  || 1280;
        const h = video.videoHeight || 720;
        snapCanvasRef.current.width  = w;
        snapCanvasRef.current.height = h;

        const ctx = snapCanvasRef.current.getContext('2d');
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(video, 0, 0, w, h);
        snapCanvasRef.current.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              console.log(`[captureImage] ✅ ${(blob.size / 1024).toFixed(1)} KB JPEG captured`);
              resolve(blob);
            } else {
              console.warn('[captureImage] Empty blob');
              resolve(null);
            }
          },
          'image/jpeg',
          0.92
        );
      };

      if (video.readyState >= 2) {
        doCapture();
      } else {
        // Wait for video to be ready (max 4s)
        const onReady = () => {
          video.removeEventListener('loadeddata', onReady);
          doCapture();
        };
        video.addEventListener('loadeddata', onReady);
        setTimeout(() => {
          video.removeEventListener('loadeddata', onReady);
          if (video.readyState >= 2) doCapture();
          else { console.warn('[captureImage] Video not ready after timeout'); resolve(null); }
        }, 4000);
      }
    });
  }, []);

  // ── Record one video clip of RECORD_DURATION_MS ────────────────────────────
  const recordClip = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        console.warn('[recordClip] No active stream — skipping');
        resolve(null);
        return;
      }

      stopActiveRecorder();

      const mimeType = getSupportedMime();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      } catch (e) {
        console.error('[recordClip] MediaRecorder init failed:', e);
        resolve(null);
        return;
      }

      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        recorderRef.current = null;
        if (chunks.length === 0) {
          console.warn('[recordClip] No chunks collected');
          resolve(null);
          return;
        }
        const finalMime = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        console.log(`[recordClip] ✅ ${(blob.size / 1024).toFixed(1)} KB video captured [${finalMime}]`);
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.onerror = (e: Event) => {
        console.error('[recordClip] MediaRecorder error:', e);
        recorderRef.current = null;
        resolve(null);
      };

      // timeslice=1000ms: guarantees ondataavailable fires every second (mobile fix)
      recorder.start(1000);

      setTimeout(() => {
        if (recorderRef.current && recorder.state === 'recording') {
          recorder.stop();
        }
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
    captureImage,
    recordClip,
    toggleCamera,
  };
};
