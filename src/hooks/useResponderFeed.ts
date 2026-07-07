import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { EmergencySession } from '../types/session.types';

export const useResponderFeed = (sessionId: string | undefined) => {
  const [session, setSession] = useState<EmergencySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'emergency_sessions', sessionId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const parsedRoute = data.route?.map((point: any) => ({
          lat: point.lat,
          lng: point.lng,
          timestamp: point.timestamp?.toDate() || new Date()
        })) || [];

        setSession({
          sessionId: data.sessionId,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          status: data.status,
          startedAt: data.startedAt?.toDate() || new Date(),
          endedAt: data.endedAt ? data.endedAt.toDate() : null,
          currentSnapshotUrl: data.currentSnapshotUrl,
          latestTelemetry: data.latestTelemetry ? {
            ...data.latestTelemetry,
            updatedAt: data.latestTelemetry.updatedAt?.toDate() || new Date()
          } : null,
          route: parsedRoute
        });
        setError(null);
      } else {
        setError('Session not found or you do not have permission to view it.');
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore subscription error", err);
      setError('Lost connection to live feed.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading, error };
};
