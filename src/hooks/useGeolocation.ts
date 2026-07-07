import { useState, useRef, useCallback } from 'react';
import type { TelemetryData } from '../types/telemetry.types';

export const useGeolocation = () => {
  const [telemetry, setTelemetry] = useState<Partial<TelemetryData>>({});
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        let battery = null;
        try {
          if ('getBattery' in navigator) {
            const batteryManager = await (navigator as any).getBattery();
            battery = Math.round(batteryManager.level * 100);
          }
        } catch (e) {
          console.warn("Battery API not available");
        }

        setTelemetry({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          battery,
          updatedAt: new Date()
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  return { telemetry, error, startWatching, stopWatching };
};
