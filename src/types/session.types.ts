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
  currentSnapshotUrl: string | null;
  latestTelemetry: TelemetryData | null;
  route: RoutePoint[];
}
