import type { TelemetryData } from './telemetry.types';

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface EmergencySession {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt: Date | null;
  /** URL of the latest uploaded media — now a 20-second video clip */
  currentSnapshotUrl: string | null;  // kept for Firestore backward-compat
  latestTelemetry: TelemetryData | null;
  route: RoutePoint[];
}
