import React from 'react';
import { motion } from 'motion/react';

interface Props {
  delayMins: number;
  reason: string;
  onSwitchRoute: () => void;
  onIgnore: () => void;
}

export function PredictiveAlertOverlay({ delayMins, reason, onSwitchRoute, onIgnore }: Props) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-80 rounded-lg border border-red-500 bg-black/95 p-4 shadow-[0_0_30px_rgba(255,0,0,0.3)] backdrop-blur-md font-sans"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl animate-pulse">⚠️</div>
        <div className="flex-1">
          <h3 className="text-red-500 font-bold text-sm">Delay forming ahead</h3>
          <p className="text-white text-xl font-bold mt-1">+{delayMins} mins expected</p>
          <p className="text-gray-400 text-xs mt-2 font-mono">Reason: {reason}</p>
          
          <div className="mt-4 flex gap-2">
            <button 
              onClick={onSwitchRoute}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-3 rounded transition-colors"
            >
              Switch Route
            </button>
            <button 
              onClick={onIgnore}
              className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Ignore
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
