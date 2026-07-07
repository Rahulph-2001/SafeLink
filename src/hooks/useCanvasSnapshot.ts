import { useState, useRef, useCallback } from 'react';

export const useCanvasSnapshot = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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

  const startCapture = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      initCanvas();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false
      });
      setStream(newStream);
      setFacingMode(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(e => console.warn("Video autoplay blocked:", e));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  }, [stream, facingMode]);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current || !stream) {
        resolve(null);
        return;
      }
      
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.6
        );
      } else {
        resolve(null);
      }
    });
  }, [stream]);

  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    startCapture(newMode);
  }, [facingMode, startCapture]);

  return { stream, error, startCapture, stopCapture, captureFrame, toggleCamera, facingMode };
};
