import { useState, useRef, useCallback } from 'react';

export const useCanvasSnapshot = () => {
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }
  };

  const startCapture = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      initCanvas();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
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
        context.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.7
        );
      } else {
        resolve(null);
      }
    });
  }, []);

  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    startCapture(newMode);
  }, [facingMode, startCapture]);

  return { error, startCapture, stopCapture, captureFrame, toggleCamera, facingMode };
};
