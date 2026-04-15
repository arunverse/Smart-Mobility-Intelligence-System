export class StabilityEngine {
  /**
   * Calculates the Stability Score (0-100) for a route segment.
   * 
   * @param currentVelocity 0.0 to 1.0 (1.0 = free flow)
   * @param historicalVariance 0.0 to 1.0 (1.0 = highly unpredictable)
   * @param trafficCapacity 0.0 to 1.0 (1.0 = full capacity)
   * @param weather 'CLEAR', 'RAIN', or 'STORM'
   */
  static calculate(
    currentVelocity: number, 
    historicalVariance: number, 
    trafficCapacity: number, 
    weather: 'CLEAR' | 'RAIN' | 'STORM'
  ): number {
    let score = 100;
    
    // Base deductions
    score -= (1 - currentVelocity) * 20;
    score -= historicalVariance * 30;
    
    // Phase Transition Logic (Non-linear drop)
    // Represents "Hidden Risk" of a sudden gridlock spike
    if (trafficCapacity > 0.85) {
      if (weather === 'RAIN') score -= 25;
      if (weather === 'STORM') score -= 45;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculates the temporal drift (min/max ETA in minutes)
   */
  static calculateDrift(baseEtaMinutes: number, stabilityScore: number): [number, number] {
    const instability = (100 - stabilityScore) / 100;
    const minDrift = Math.max(0, baseEtaMinutes - (baseEtaMinutes * instability * 0.1));
    const maxDrift = baseEtaMinutes + (baseEtaMinutes * instability * 0.5);
    return [Math.round(minDrift), Math.round(maxDrift)];
  }
}
