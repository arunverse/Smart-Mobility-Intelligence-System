import React from 'react';
import { RouteData } from '../types';
import { cn } from '../lib/utils';
import { ShieldCheck, Activity, Zap } from 'lucide-react';

interface RouteMatrixProps {
  routes: RouteData[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

function Sparkline({ data, color }: { data: number[], color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 16;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RouteMatrix({ routes, selectedRouteId, onSelectRoute }: RouteMatrixProps) {
  return (
    <div className="flex flex-col gap-3">
      {routes.map((route) => {
        const isActive = route.id === selectedRouteId;
        const stabilityData = route.segments.map(s => s.safety_score);
        
        // Determine styling based on route type
        let typeBgColor = "bg-[rgba(255,255,255,0.03)]";
        let typeBorderColor = "border-[var(--color-border-subtle)]";
        let hoverBorderColor = "hover:border-[rgba(255,255,255,0.2)]";
        let Icon = Activity;

        if (route.type === 'RELIABLE') {
          typeBgColor = "bg-blue-900/10";
          typeBorderColor = "border-blue-900/30";
          hoverBorderColor = "hover:border-blue-500/50";
          Icon = Activity;
        } else if (route.type === 'SECURE') {
          typeBgColor = "bg-emerald-900/10";
          typeBorderColor = "border-emerald-900/30";
          hoverBorderColor = "hover:border-emerald-500/50";
          Icon = ShieldCheck;
        } else if (route.type === 'RISKY') {
          typeBgColor = "bg-red-900/10";
          typeBorderColor = "border-red-900/30";
          hoverBorderColor = "hover:border-red-500/50";
          Icon = Zap;
        }
        
        return (
          <div 
            key={route.id}
            onClick={() => onSelectRoute(route.id)}
            className={cn(
              "cursor-pointer rounded border p-4 transition-all duration-200",
              typeBgColor,
              isActive 
                ? "border-[var(--color-emerald)] bg-[rgba(0,255,65,0.05)] shadow-[0_0_15px_rgba(0,255,65,0.1)]" 
                : `${typeBorderColor} ${hoverBorderColor}`
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs flex items-center gap-1.5">
                  <Icon className={cn("w-3.5 h-3.5", 
                    route.type === 'RELIABLE' ? "text-blue-400" :
                    route.type === 'SECURE' ? "text-emerald-400" : "text-red-400"
                  )} />
                  {route.name}
                </span>
                {route.type && (
                  <span className={cn(
                    "inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded",
                    route.type === 'RELIABLE' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                    route.type === 'SECURE' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}>
                    {route.type}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="block font-bold text-lg">{route.eta}</span>
                {route.temporalDrift && (
                  <span className="text-[9px] text-[var(--color-text-secondary)]">
                    DRIFT: {route.temporalDrift[0]}-{route.temporalDrift[1]}m
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] text-[var(--color-text-secondary)]">DECISION STABILITY</span>
              <Sparkline data={stabilityData} color={isActive ? 'var(--color-emerald)' : 'var(--color-text-secondary)'} />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                SAFETY
                <span className="mt-1 block text-xs text-[var(--color-text-primary)]">{route.avgSafety.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                LUMEN
                <span className="mt-1 block text-xs text-[var(--color-text-primary)]">{route.avgLumen.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                RISK
                <span className="mt-1 block text-xs text-[var(--color-text-primary)]">{route.avgRisk.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                COG. LOAD
                <span className={cn(
                  "mt-1 block text-xs",
                  route.cognitiveLoad === 'LOW' ? "text-emerald-400" :
                  route.cognitiveLoad === 'MEDIUM' ? "text-yellow-400" : "text-red-400"
                )}>{route.cognitiveLoad || 'N/A'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
