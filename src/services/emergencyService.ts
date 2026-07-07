import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { TelemetryData } from '../types/telemetry.types';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile } from '../types/user.types';

export const createSession = async (user: UserProfile): Promise<string> => {
  const sessionId = uuidv4();
  const sessionRef = doc(db, 'emergency_sessions', sessionId);
  
  await setDoc(sessionRef, {
    sessionId,
    userId: user.uid,
    userName: user.name,
    userEmail: user.email,
    status: 'active',
    startedAt: serverTimestamp(),
    endedAt: null,
    currentSnapshotUrl: null,
    latestTelemetry: null,
    route: []
  });
  
  return sessionId;
};

export const updateSessionTelemetry = async (
  sessionId: string, 
  telemetry: Partial<TelemetryData>, 
  snapshotUrl: string | null
): Promise<void> => {
  const sessionRef = doc(db, 'emergency_sessions', sessionId);
  
  const updatePayload: any = {
    latestTelemetry: {
      ...telemetry,
      updatedAt: serverTimestamp()
    }
  };

  if (snapshotUrl) {
    updatePayload.currentSnapshotUrl = snapshotUrl;
  }

  // Only append to route if we have valid coordinates
  if (telemetry.lat !== undefined && telemetry.lng !== undefined) {
    updatePayload.route = arrayUnion({
      lat: telemetry.lat,
      lng: telemetry.lng,
      timestamp: Timestamp.now()
    });
  }

  await updateDoc(sessionRef, updatePayload);
};

export const endSession = async (sessionId: string): Promise<void> => {
  const sessionRef = doc(db, 'emergency_sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'ended',
    endedAt: serverTimestamp()
  });
};
