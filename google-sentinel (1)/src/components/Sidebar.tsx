import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PulseIndicator } from './PulseIndicator';
import { RouteMatrix } from './RouteMatrix';
import { TerminalFeed } from './TerminalFeed';
import { RouteData } from '../types';

interface SidebarProps {
  routes: RouteData[];
  sentinelMode: boolean;
  setSentinelMode: (val: boolean) => void;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  activeTrigger: string;
  sourceQuery: string;
  setSourceQuery: (val: string) => void;
  destQuery: string;
  setDestQuery: (val: string) => void;
  onCalculateRoute: () => void;
  onUseLocation: () => void;
  isRouting: boolean;
  navState: string;
  onStartNavigation: () => void;
}

export function Sidebar({ 
  routes,
  sentinelMode, 
  setSentinelMode, 
  selectedRouteId, 
  setSelectedRouteId, 
  activeTrigger,
  sourceQuery,
  setSourceQuery,
  destQuery,
  setDestQuery,
  onCalculateRoute,
  onUseLocation,
  isRouting,
  navState,
  onStartNavigation
}: SidebarProps) {
  const [isThinking, setIsThinking] = useState(false);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<{ text: string, tag: string } | null>(null);

  useEffect(() => {
    async function fetchRecommendation() {
      setIsThinking(true);
      
      let contextStr = "Standard operating conditions.";
      let initialMessages = [
        '[SYS]: Analyzing Phase Transitions...',
        '[SYS]: Rerouting for Luminous Density...'
      ];

      if (activeTrigger === 'monsoon') {
        contextStr = "CRITICAL: Monsoon conditions detected. Heavy rain, flooded streets. Stability dropping.";
        initialMessages = [
          '[SYS]: MONSOON DETECTED',
          '[SYS]: Recalculating Stability Scores...',
          '[SYS]: Variance Risk spiked by 40%'
        ];
      } else if (activeTrigger === 'nightfall') {
        contextStr = "CRITICAL: Night-fall. Visibility low. Prioritize Lumen Index and well-lit corridors.";
        initialMessages = [
          '[SYS]: NIGHT-FALL DETECTED',
          '[SYS]: Activating Luminous UI...',
          '[SYS]: Avoiding unlit Black Zones'
        ];
      } else if (activeTrigger === 'signal_failure') {
        contextStr = "CRITICAL: Traffic signal failure detected at major intersections. High risk of cascading gridlock.";
        initialMessages = [
          '[SYS]: SIGNAL FAILURE DETECTED',
          '[SYS]: Predicting cascading gridlock...',
          '[SYS]: Rerouting to secondary arteries'
        ];
      }

      setTerminalMessages(initialMessages);

      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routes: routes,
            context: contextStr
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setRecommendation({ text: data.recommendation_text, tag: data.primary_reason_tag });
          setTerminalMessages(prev => [...prev, `[SYS]: RECOMMENDATION: ${data.recommended_route_id || 'SENTINEL_CORRIDOR'}`]);
          if (data.recommended_route_id) {
            setSelectedRouteId(data.recommended_route_id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendation", error);
      } finally {
        setIsThinking(false);
      }
    }

    fetchRecommendation();
  }, [setSelectedRouteId, activeTrigger]);

  return (
    <motion.aside 
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="glass-panel flex h-full w-[320px] flex-col rounded p-6"
    >
      <div className="mb-8">
        <h1 className="mb-2 font-mono text-sm tracking-[2px] text-[var(--color-text-secondary)]">
          SENTINEL_AGENT_v1.0
        </h1>
        <PulseIndicator />
      </div>

      <div className="mb-6 border-t border-[var(--color-border-subtle)] py-6">
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={onUseLocation} 
              title="Use Current Location"
              className="flex items-center justify-center rounded border border-[var(--color-emerald)] bg-[rgba(0,255,65,0.1)] px-3 text-[var(--color-emerald)] hover:bg-[rgba(0,255,65,0.2)]"
            >
              📍
            </button>
            <input 
              type="text" 
              placeholder="Source Location" 
              value={sourceQuery}
              onChange={e => setSourceQuery(e.target.value)}
              className="w-full rounded border border-[var(--color-border-subtle)] bg-[rgba(0,0,0,0.5)] px-3 py-2 font-mono text-xs text-white focus:border-[var(--color-emerald)] focus:outline-none"
            />
          </div>
          <input 
            type="text" 
            placeholder="Destination Location" 
            value={destQuery}
            onChange={e => setDestQuery(e.target.value)}
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[rgba(0,0,0,0.5)] px-3 py-2 font-mono text-xs text-white focus:border-[var(--color-emerald)] focus:outline-none"
          />
          <button 
            onClick={onCalculateRoute}
            disabled={isRouting || !destQuery}
            className="mt-2 w-full rounded bg-[var(--color-emerald)] px-4 py-2 font-mono text-xs font-bold text-black hover:bg-[#00cc33] disabled:opacity-50"
          >
            {isRouting ? 'CALCULATING...' : 'INITIALIZE ROUTING'}
          </button>
        </div>

        <div 
          className="flex h-12 w-full cursor-pointer items-center justify-between border border-[var(--color-emerald)] bg-[rgba(0,255,65,0.05)] px-4"
          onClick={() => setSentinelMode(!sentinelMode)}
        >
          <span className="font-mono text-xs text-[var(--color-emerald)]">SENTINEL MODE</span>
          <span className="text-[var(--color-emerald)]">{sentinelMode ? 'ON' : 'OFF'}</span>
        </div>
        <p className="mt-2 font-mono text-[10px] text-[var(--color-text-secondary)]">
          {sentinelMode ? 'GLOW_FUSED_GRADIENT_ACTIVE' : 'STANDARD_TELEMETRY_ACTIVE'}
        </p>
      </div>

      <RouteMatrix 
        routes={routes} 
        selectedRouteId={selectedRouteId} 
        onSelectRoute={setSelectedRouteId} 
      />

      <div className="mt-4 mb-4">
        <button 
          onClick={onStartNavigation}
          disabled={navState !== 'idle'}
          className={`w-full rounded py-3 font-mono text-xs font-bold transition-colors ${navState === 'idle' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          {navState === 'idle' ? 'START NAVIGATION' : navState === 'analyzing' ? 'ANALYZING ROUTE...' : 'NAVIGATING...'}
        </button>
      </div>

      <TerminalFeed messages={terminalMessages} isThinking={isThinking} />

      {recommendation && (
        <div className="mt-4 p-3 border border-[var(--color-emerald)] bg-[rgba(0,255,65,0.05)] rounded">
          <div className="text-[10px] text-[var(--color-emerald)] font-bold mb-1">{recommendation.tag}</div>
          <div className="text-xs text-[var(--color-text-primary)] leading-relaxed">{recommendation.text}</div>
        </div>
      )}

      <div className="mt-auto pt-6">
        <p className="font-mono text-[9px] leading-relaxed opacity-50">
          SYSTEM: READY<br/>
          WEBGL_ACCELERATION: ACTIVE<br/>
          GEMINI_REASONING: {isThinking ? 'ACTIVE' : 'STANDBY'}
        </p>
      </div>
    </motion.aside>
  );
}
