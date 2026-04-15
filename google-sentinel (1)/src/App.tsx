/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SentinelMap } from './components/SentinelMap';
import { TacticalModeOverlay } from './components/TacticalModeOverlay';
import { PredictiveAlertOverlay } from './components/PredictiveAlertOverlay';
import { mockRoutes } from './data/mockRoutes';
import { geocode, fetchRealRoutes } from './lib/routing';
import { RouteData } from './types';

export default function App() {
  const [routes, setRoutes] = useState<RouteData[]>(mockRoutes);
  const [sentinelMode, setSentinelMode] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState(mockRoutes[0].id);
  const [tacticalMode, setTacticalMode] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<'none' | 'monsoon' | 'nightfall' | 'signal_failure'>('none');
  
  const [sourceQuery, setSourceQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [sourceCoords, setSourceCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Predictive Navigation State
  const [navState, setNavState] = useState<'idle' | 'analyzing' | 'navigating' | 'alert'>('idle');
  const [alertData, setAlertData] = useState<{delay: number, reason: string, altRouteId: string} | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let trafficInterval: NodeJS.Timeout;

    if (navState === 'analyzing') {
      // Simulate real-time analysis delay
      timer = setTimeout(() => {
        setNavState('navigating');
        
        // Simple Risk Engine Logic
        let riskLevel = 0;
        let reasons = [];
        
        // Mock inputs
        const currentSpeed = 15; // mph
        const expectedSpeed = 45; // mph
        const isRaining = activeTrigger === 'monsoon';
        const isPeakHour = true; // Mocking peak hour

        if (currentSpeed < expectedSpeed - 20) {
          riskLevel += 3;
          reasons.push("Speed drop");
        }
        if (isRaining) {
          riskLevel += 2;
          reasons.push("rain detected");
        }
        if (isPeakHour) {
          riskLevel += 1;
          reasons.push("peak hour volume");
        }

        // If risk is high enough, trigger the alert after a short "real-time" delay
        if (riskLevel >= 3) {
          setTimeout(() => {
            // Find a distinct alternative route, preferably the 'SECURE' or 'RELIABLE' one
            const altRoute = routes.find(r => r.id !== selectedRouteId && r.type !== 'RISKY') || routes.find(r => r.id !== selectedRouteId) || routes[0];
            setAlertData({
              delay: Math.floor(Math.random() * 8) + 4, // 4 to 11 mins
              reason: reasons.join(" + "),
              altRouteId: altRoute.id
            });
            setNavState('alert');
          }, 2500); // 2.5 seconds into navigation, the alert pops up
        }

      }, 1500);
    } else if (navState === 'navigating') {
      // Real-time traffic simulation
      trafficInterval = setInterval(() => {
        // 15% chance every 4 seconds to suddenly worsen conditions and trigger alert
        if (Math.random() > 0.85 && activeTrigger !== 'none') {
          const altRoute = routes.find(r => r.id !== selectedRouteId && r.type !== 'RISKY') || routes.find(r => r.id !== selectedRouteId) || routes[0];
          setAlertData({
            delay: Math.floor(Math.random() * 15) + 5,
            reason: "Live traffic anomaly detected",
            altRouteId: altRoute.id
          });
          setNavState('alert');
        } else {
          // Just fluctuate ETA and safety slightly to simulate live data
          setRoutes(prev => prev.map(r => {
             if (r.id === selectedRouteId && Math.random() > 0.5) {
               const currentEta = parseInt(r.eta);
               const newSafety = Math.max(0.1, r.avgSafety - (Math.random() * 0.05));
               return { ...r, eta: `${currentEta + 1}m`, avgSafety: newSafety };
             }
             return r;
          }));
        }
      }, 4000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(trafficInterval);
    };
  }, [navState, activeTrigger, routes, selectedRouteId]);

  const handleStartNavigation = () => {
    setNavState('analyzing');
    setAlertData(null);
  };

  const handleSwitchRoute = () => {
    if (alertData) {
      // Find the alternative route. If the current one is selected, pick the next one.
      const altRoute = routes.find(r => r.id === alertData.altRouteId) || routes.find(r => r.id !== selectedRouteId) || routes[0];
      setSelectedRouteId(altRoute.id);
      setNavState('navigating');
      setAlertData(null);
      console.log(`[SENTINEL] Switched to route: ${altRoute.name} (${altRoute.id})`);
    }
  };

  const handleIgnoreAlert = () => {
    setNavState('navigating');
    setAlertData(null);
  };

  const handleUseLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setSourceCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSourceQuery('Current Location');
      }, (err) => {
        alert('Failed to get location: ' + err.message);
      });
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleCalculateRoute = async () => {
    if (!destQuery) return;
    setIsRouting(true);
    setNavState('idle');
    setAlertData(null);
    try {
      let src = sourceCoords;
      if (sourceQuery !== 'Current Location' || !src) {
        src = await geocode(sourceQuery);
      }
      const dest = await geocode(destQuery);
      
      if (src && dest) {
        const newRoutes = await fetchRealRoutes(src, dest);
        if (newRoutes.length > 0) {
          setRoutes(newRoutes);
          setSelectedRouteId(newRoutes[0].id);
          setTacticalMode(false);
          setActiveTrigger('none');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Routing failed: ' + err.message);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--color-bg-deep)] text-[var(--color-text-primary)] font-sans">
      <SentinelMap 
        routes={routes} 
        selectedRouteId={selectedRouteId} 
        onSelectRoute={setSelectedRouteId}
        sentinelMode={sentinelMode} 
        tacticalMode={tacticalMode}
        activeTrigger={activeTrigger}
      />

      <div className="pointer-events-none absolute inset-0 z-10 grid h-full grid-cols-[320px_1fr] gap-6 p-6">
        <div className="pointer-events-auto h-full">
          <Sidebar 
            routes={routes}
            sentinelMode={sentinelMode}
            setSentinelMode={setSentinelMode}
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            activeTrigger={activeTrigger}
            sourceQuery={sourceQuery}
            setSourceQuery={setSourceQuery}
            destQuery={destQuery}
            setDestQuery={setDestQuery}
            onCalculateRoute={handleCalculateRoute}
            onUseLocation={handleUseLocation}
            isRouting={isRouting}
            navState={navState}
            onStartNavigation={handleStartNavigation}
          />
        </div>

        <main className="flex flex-col justify-between pointer-events-none relative">
          {navState === 'alert' && alertData && (
            <div className="pointer-events-auto">
              <PredictiveAlertOverlay 
                delayMins={alertData.delay}
                reason={alertData.reason}
                onSwitchRoute={handleSwitchRoute}
                onIgnore={handleIgnoreAlert}
              />
            </div>
          )}
          
          <header className="flex items-start justify-between">
            <div className="glass-panel px-4 py-2 font-mono text-xs text-[var(--color-text-secondary)]">
              LAT: 12.6389° N | LNG: 77.4404° E
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="glass-panel px-4 py-2 font-mono text-xs text-[var(--color-amber)] pointer-events-auto cursor-pointer hover:bg-white/5" onClick={() => setTacticalMode(!tacticalMode)}>
                {tacticalMode ? 'ABORT TACTICAL MODE' : 'SIMULATE APPROACH (<500m)'}
              </div>
              
              {/* Trigger Panel */}
              <div className="glass-panel mt-4 flex flex-col gap-2 p-4 pointer-events-auto w-64">
                <div className="text-[10px] font-mono text-[var(--color-emerald)] mb-1 opacity-80">[ENVIRONMENTAL_SIMULATION]</div>
                
                <button 
                  onClick={() => setActiveTrigger('monsoon')} 
                  className={`px-3 py-2 text-xs font-mono text-left transition-colors border ${activeTrigger === 'monsoon' ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'border-transparent hover:bg-white/5 text-[var(--color-text-secondary)]'}`}
                >
                  [1] SIMULATE MONSOON
                </button>
                
                <button 
                  onClick={() => setActiveTrigger('nightfall')} 
                  className={`px-3 py-2 text-xs font-mono text-left transition-colors border ${activeTrigger === 'nightfall' ? 'bg-blue-900/40 border-blue-500 text-blue-300' : 'border-transparent hover:bg-white/5 text-[var(--color-text-secondary)]'}`}
                >
                  [2] SIMULATE NIGHT-FALL
                </button>
                
                <button 
                  onClick={() => setActiveTrigger('signal_failure')} 
                  className={`px-3 py-2 text-xs font-mono text-left transition-colors border ${activeTrigger === 'signal_failure' ? 'bg-red-900/40 border-red-500 text-red-300' : 'border-transparent hover:bg-white/5 text-[var(--color-text-secondary)]'}`}
                >
                  [3] SIMULATE SIGNAL FAILURE
                </button>

                {activeTrigger !== 'none' && (
                  <button 
                    onClick={() => setActiveTrigger('none')} 
                    className="mt-2 text-[10px] font-mono text-gray-500 hover:text-white text-left"
                  >
                    [RESET SIMULATION]
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="glass-panel flex gap-12 self-start px-6 py-4 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)]">AVG LUMEN INDEX</span>
              <span className="text-2xl font-bold">0.872</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)]">PREDICTIVE STABILITY</span>
              <span className="text-2xl font-bold text-[var(--color-emerald)]">94.2%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)]">ACTIVE AGENTS</span>
              <span className="text-2xl font-bold">1,402</span>
            </div>
          </div>
        </main>
      </div>

      {tacticalMode && (
        <TacticalModeOverlay 
          instruction="Entry Point A is currently congested by logistics vehicles. Redirecting to the North Basement Ramp for a 4-minute walk to the lobby."
        />
      )}

      <div className="absolute bottom-6 right-6 z-20 text-right font-mono text-[10px] text-[var(--color-emerald)] opacity-70 pointer-events-none">
        [BOOT] Sentinel OS v1.0.4<br/>
        [SYNC] Network Cluster 7G-Delta<br/>
        [MAP] NYC_GRID_SILENCED: TRUE<br/>
        [TIME] 22:45:12 GMT-4
      </div>
    </div>
  );
}
