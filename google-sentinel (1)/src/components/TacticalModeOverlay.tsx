import React from 'react';
import { motion } from 'motion/react';

interface TacticalModeOverlayProps {
  instruction: string;
}

export function TacticalModeOverlay({ instruction }: TacticalModeOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-12"
    >
      {/* Vignette Focus Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(5,5,5,0.85)_70%)]" />

      {/* Street View Snapshot Panel */}
      <div className="pointer-events-auto relative flex w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--color-emerald)] bg-[var(--color-cyber-black)] shadow-[0_0_50px_rgba(0,255,65,0.15)]">
        
        {/* Left: Image / Camera Feed */}
        <div className="relative h-[400px] w-2/3 bg-[#111]">
          {/* Placeholder for Gemini-processed Street View */}
          <img 
            src="https://picsum.photos/seed/building-entrance/800/600" 
            alt="Building Entrance"
            className="h-full w-full object-cover opacity-60 grayscale"
            referrerPolicy="no-referrer"
          />
          
          {/* AI Safety Path Overlay (SVG) */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path 
              d="M 400 600 Q 450 400 600 350 T 650 250" 
              fill="none" 
              stroke="url(#pathGradient)" 
              strokeWidth="8" 
              strokeDasharray="10, 10"
              className="animate-[dash_2s_linear_infinite]"
            />
            <circle cx="650" cy="250" r="12" fill="var(--color-emerald)" className="animate-pulse" />
          </svg>

          {/* HUD Elements */}
          <div className="absolute left-4 top-4 font-mono text-xs text-[var(--color-emerald)]">
            [CAM_01] LIVE FEED<br/>
            ANALYSIS: STRUCTURAL ENTRY
          </div>
        </div>

        {/* Right: Agent Instructions */}
        <div className="flex w-1/3 flex-col justify-between border-l border-[var(--color-border-subtle)] p-6">
          <div>
            <h2 className="mb-4 font-mono text-sm tracking-widest text-[var(--color-amber)]">
              TACTICAL OVERRIDE
            </h2>
            <p className="font-sans text-sm leading-relaxed text-[var(--color-text-primary)]">
              {instruction}
            </p>
          </div>
          
          <div className="mt-8">
            <div className="mb-2 flex justify-between font-mono text-[10px] text-[var(--color-text-secondary)]">
              <span>LOGISTICS BLOCKAGE</span>
              <span className="text-[var(--color-amber)]">DETECTED</span>
            </div>
            <div className="mb-2 flex justify-between font-mono text-[10px] text-[var(--color-text-secondary)]">
              <span>PEDESTRIAN RAMP</span>
              <span className="text-[var(--color-emerald)]">CLEAR</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[var(--color-text-secondary)]">
              <span>PARKING WAIT</span>
              <span className="text-[var(--color-text-primary)]">12 MIN</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
