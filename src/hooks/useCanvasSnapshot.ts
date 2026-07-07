import { useState, useRef, useCallback } from 'react';

export const useCanvasSnapshot = () => {
  const [error, setError] = useState<string | null>(null);
  // Default to front camera ('user'); toggle switches to back ('environment') and back.
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

  // Use refs so captureFrame always sees the latest values inside setInterval (no stale closure)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initCanvas = () => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      // Dimensions will be updated dynamically at capture time
      // to match the actual camera stream resolution.
      canvasRef.current.width = 1920;
      canvasRef.current.height = 1080;
    }
  };

  const startCapture = useCallback(async (mode: 'environment' | 'user' = 'user') => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      initCanvas();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width:  { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false
      });
      // Store directly into ref — no async setState delay
      streamRef.current = newStream;
      setFacingMode(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(e => console.warn("Video autoplay blocked:", e));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Reads from refs — always gets the current value, avoids stale closures
      if (!videoRef.current || !canvasRef.current || !streamRef.current) {
        console.warn("captureFrame: missing video, canvas, or stream", {
          video: !!videoRef.current,
          canvas: !!canvasRef.current,
          stream: !!streamRef.current
        });
        resolve(null);
        return;
      }

      const video = videoRef.current;
      // Ensure video has actual frame data before drawing to canvas
      if (video.readyState < 2) {
        console.warn("captureFrame: video not ready, readyState =", video.readyState);
        resolve(null);
        return;
      }

      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Sync canvas size to the real stream resolution every frame
        // so we never crop or upscale the image.
        const actualW = video.videoWidth  || 1920;
        const actualH = video.videoHeight || 1080;
        canvasRef.current.width  = actualW;
        canvasRef.current.height = actualH;

        context.drawImage(video, 0, 0, actualW, actualH);
        canvasRef.current.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.95   // High quality (was 0.7)
        );
      } else {
        resolve(null);
      }
    });
  }, []);

  const toggleCamera = useCallback(() => {
    // Front ('user') → Back ('environment') → Front ('user') ...
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCapture(newMode);
  }, [facingMode, startCapture]);

  return { error, startCapture, stopCapture, captureFrame, toggleCamera, facingMode };
};
