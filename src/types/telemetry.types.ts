export interface TelemetryData {
  lat: number;
  lng: number;
  speed: number | null; // in m/s
  heading: number | null;
  battery: number | null; // 0 to 100
  updatedAt: Date;
}
