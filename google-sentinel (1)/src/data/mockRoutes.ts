import { RouteData } from '../types';
import { StabilityEngine } from '../lib/StabilityEngine';

const generateMockRoute = (id: string, name: string, type: 'RELIABLE' | 'SECURE' | 'RISKY', offset: number): RouteData => {
  const start = [77.4404, 12.6389]; // Harohalli
  const end = [77.5946, 12.9716]; // Bengaluru
  
  const segments = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const lat = start[1] + (end[1] - start[1]) * progress;
    const lng = start[0] + (end[0] - start[0]) * progress;
    
    // Add a curve for visual distinction
    const curve = Math.sin(progress * Math.PI) * offset;
    
    segments.push({
      lat: lat + curve,
      lng: lng - curve,
      speed: 30 + Math.random() * 20,
      congestion_level: Math.random(),
      safety_score: type === 'SECURE' ? 0.9 + Math.random()*0.1 : type === 'RELIABLE' ? 0.8 + Math.random()*0.1 : 0.5 + Math.random()*0.2,
      lumen_index: type === 'SECURE' ? 0.9 : 0.6,
      variance_risk: type === 'RISKY' ? 0.8 : 0.2
    });
  }

  const baseEta = type === 'RISKY' ? 45 : type === 'RELIABLE' ? 55 : 60;
  
  const velocity = type === 'RISKY' ? 0.9 : 0.6;
  const variance = type === 'RISKY' ? 0.75 : 0.15;
  const capacity = type === 'RISKY' ? 0.9 : 0.4;
  const weather = 'CLEAR';

  const stabilityScore = StabilityEngine.calculate(velocity, variance, capacity, weather);
  const temporalDrift = StabilityEngine.calculateDrift(baseEta, stabilityScore);

  return {
    id,
    name,
    type,
    eta: `${baseEta}m`,
    distance: '35 km',
    segments,
    avgSafety: type === 'SECURE' ? 0.92 : type === 'RELIABLE' ? 0.85 : 0.65,
    avgLumen: type === 'SECURE' ? 0.88 : 0.75,
    avgRisk: type === 'RISKY' ? 0.75 : 0.15,
    cognitiveLoad: type === 'RISKY' ? 'HIGH' : 'LOW',
    stabilityScore,
    temporalDrift
  };
};

export const mockRoutes: RouteData[] = [
  generateMockRoute('route_1', 'THE STABLE PATH', 'RELIABLE', 0),
  generateMockRoute('route_2', 'THE SAFE CORRIDOR', 'SECURE', 0.03),
  generateMockRoute('route_3', 'THE FAST/RISKY ROUTE', 'RISKY', -0.03)
];

