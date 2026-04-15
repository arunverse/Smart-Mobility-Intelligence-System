export type RouteSegment = {
  lat: number;
  lng: number;
  safety_score: number;
  lumen_index: number;
  variance_risk: number;
};

export type RouteData = {
  id: string;
  name: string;
  type?: 'RELIABLE' | 'SECURE' | 'RISKY';
  cognitiveLoad?: 'LOW' | 'MEDIUM' | 'HIGH';
  eta: string;
  segments: RouteSegment[];
  avgSafety: number;
  avgLumen: number;
  avgRisk: number;
  stabilityScore?: number;
  temporalDrift?: [number, number];
};

