import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function PulseIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-[11px] uppercase text-[var(--color-emerald)]", className)}>
      <div className="relative flex h-2 w-2 items-center justify-center">
        <motion.span 
          className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-emerald)] opacity-75"
          animate={{ scale: [1, 2.5], opacity: [0.75, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-emerald)] shadow-[0_0_8px_var(--color-emerald)]"></span>
      </div>
      <span>Scanning Live Telemetry</span>
    </div>
  );
}
