import { RouteData } from '../types';
import { StabilityEngine } from './StabilityEngine';

export async function geocode(query: string) {
  if (query === 'Current Location') return null;
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
  }
  throw new Error('Location not found');
}

export async function fetchRealRoutes(src: {lat: number, lng: number}, dest: {lat: number, lng: number}): Promise<RouteData[]> {
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${src.lng},${src.lat};${dest.lng},${dest.lat}?alternatives=true&overview=full&geometries=geojson`);
  const data = await res.json();
  
  if (data.code !== 'Ok') throw new Error('Routing failed');

  let rawRoutes = data.routes;
  
  // If we don't have 3 routes, generate real detours using waypoints to force different paths
  if (rawRoutes.length < 3) {
    const dx = dest.lng - src.lng;
    const dy = dest.lat - src.lat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len; // Perpendicular X
    const py = dx / len;  // Perpendicular Y

    // Generate up to 2 detour waypoints (approx 20% of the distance perpendicular)
    const detours = [
      { lng: src.lng + dx/2 + px * len * 0.2, lat: src.lat + dy/2 + py * len * 0.2 },
      { lng: src.lng + dx/2 - px * len * 0.2, lat: src.lat + dy/2 - py * len * 0.2 }
    ];

    for (const detour of detours) {
      if (rawRoutes.length >= 3) break;
      try {
        const detourRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${src.lng},${src.lat};${detour.lng},${detour.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
        const detourData = await detourRes.json();
        if (detourData.code === 'Ok' && detourData.routes && detourData.routes.length > 0) {
          rawRoutes.push(detourData.routes[0]);
        }
      } catch (e) {
        console.error("Detour fetch failed", e);
      }
    }
  }

  // Ensure we have exactly 3 routes for the demo (fallback to mathematical offset if network fails)
  while (rawRoutes.length < 3) {
    const clone = JSON.parse(JSON.stringify(rawRoutes[0]));
    const offsetIndex = rawRoutes.length;
    
    const start = clone.geometry.coordinates[0];
    const end = clone.geometry.coordinates[clone.geometry.coordinates.length - 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len;
    const py = dx / len;

    const offsetMagnitude = (offsetIndex === 1 ? 0.02 : -0.02) * (len * 10);

    clone.geometry.coordinates = clone.geometry.coordinates.map((c: number[], idx: number, arr: any[]) => {
      const progress = idx / (arr.length - 1);
      const parabola = 4 * progress * (1 - progress);
      return [
        c[0] + px * offsetMagnitude * parabola, 
        c[1] + py * offsetMagnitude * parabola
      ];
    });
    clone.duration += 120 + Math.random() * 300;
    rawRoutes.push(clone);
  }
  rawRoutes = rawRoutes.slice(0, 3);

  const profiles = [
    { name: 'THE STABLE PATH', type: 'RELIABLE' as const, cognitiveLoad: 'LOW' as const, safetyMod: 0.9, lumenMod: 0.8, riskMod: 0.1, etaMultiplier: 1.05 },
    { name: 'THE SAFE CORRIDOR', type: 'SECURE' as const, cognitiveLoad: 'LOW' as const, safetyMod: 0.95, lumenMod: 0.95, riskMod: 0.15, etaMultiplier: 1.15 },
    { name: 'THE FAST/RISKY ROUTE', type: 'RISKY' as const, cognitiveLoad: 'HIGH' as const, safetyMod: 0.4, lumenMod: 0.3, riskMod: 0.85, etaMultiplier: 0.85 }
  ];

  return rawRoutes.map((r: any, i: number) => {
    const profile = profiles[i];
    
    const segments = r.geometry.coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
      safety_score: profile.safetyMod - (Math.random() * 0.1), 
      lumen_index: profile.lumenMod - (Math.random() * 0.1),
      variance_risk: profile.riskMod + (Math.random() * 0.1)
    }));

    const avgSafety = segments.reduce((acc: number, s: any) => acc + s.safety_score, 0) / segments.length;
    const avgLumen = segments.reduce((acc: number, s: any) => acc + s.lumen_index, 0) / segments.length;
    const avgRisk = segments.reduce((acc: number, s: any) => acc + s.variance_risk, 0) / segments.length;

    const baseEta = Math.ceil((r.duration / 60) * profile.etaMultiplier);
    const stabilityScore = StabilityEngine.calculate(0.8, avgRisk, 0.5, 'CLEAR');
    const temporalDrift = StabilityEngine.calculateDrift(baseEta, stabilityScore);

    return {
      id: `route_${i}_${Date.now()}`,
      name: profile.name,
      type: profile.type,
      cognitiveLoad: profile.cognitiveLoad,
      eta: `${baseEta}m`,
      segments,
      avgSafety,
      avgLumen,
      avgRisk,
      stabilityScore,
      temporalDrift
    };
  });
}
