import React, { useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker, useMap, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RouteData } from '../types';

interface SentinelMapProps {
  routes: RouteData[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  sentinelMode: boolean;
  tacticalMode: boolean;
  activeTrigger: string;
}

function MapController({ tacticalMode, destination, routes, selectedRouteId }: { tacticalMode: boolean, destination: any, routes: RouteData[], selectedRouteId: string }) {
  const { current: map } = useMap();
  
  useEffect(() => {
    if (!map || !routes || routes.length === 0) return;
    
    const selectedRoute = routes.find(r => r.id === selectedRouteId);
    if (!selectedRoute) return;

    if (tacticalMode && destination) {
      map.flyTo({
        center: [destination.lng, destination.lat],
        zoom: 18,
        pitch: 60,
        bearing: 90,
        duration: 2000
      });
    } else {
      const lats = selectedRoute.segments.map(s => s.lat);
      const lngs = selectedRoute.segments.map(s => s.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 100, duration: 2000 }
      );
    }
  }, [map, tacticalMode, destination, routes, selectedRouteId]);

  return null;
}

export function SentinelMap({ routes, selectedRouteId, onSelectRoute, sentinelMode, tacticalMode, activeTrigger }: SentinelMapProps) {
  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const destination = selectedRoute?.segments[selectedRoute.segments.length - 1];
  const source = selectedRoute?.segments[0];

  const geojsonData = useMemo(() => {
    const features: any[] = [];
    routes.forEach(route => {
      const isSelected = route.id === selectedRouteId;
      
      if (!sentinelMode) {
        features.push({
          type: 'Feature',
          properties: { 
            color: isSelected ? '#4285F4' : '#1a365d', 
            opacity: isSelected ? 1 : 0.5, 
            width: isSelected ? 6 : 4, 
            mode: 'standard',
            routeId: route.id
          },
          geometry: { 
            type: 'LineString', 
            coordinates: route.segments.map(s => [s.lng, s.lat]) 
          }
        });
      } else {
        const opacity = isSelected ? 1 : 0.15;
        const widthMultiplier = isSelected ? 1 : 0.5;

        for (let i = 0; i < route.segments.length - 1; i++) {
          const start = route.segments[i];
          const end = route.segments[i+1];
          
          let color = '#00FF41'; 

          if (activeTrigger === 'monsoon') {
            color = '#8A2BE2'; // Deep Purple for Monsoon
          } else if (activeTrigger === 'nightfall') {
            if (start.lumen_index < 0.7) {
              color = '#111111'; // Black Zone
            } else {
              color = '#00FF41'; // Luminous Path
            }
          } else if (activeTrigger === 'signal_failure') {
            if (start.variance_risk > 0.15) {
              color = '#FF0000'; // Red Gridlock
            } else {
              color = '#FFB000'; // Amber Warning
            }
          } else {
            // Default Sentinel Mode
            if (start.variance_risk > 0.2) color = '#FFB000'; 
            if (start.lumen_index < 0.5) color = '#8A2BE2'; 
          }

          features.push({
            type: 'Feature',
            properties: { color, mode: 'sentinel', opacity, widthMultiplier, routeId: route.id },
            geometry: { 
              type: 'LineString', 
              coordinates: [[start.lng, start.lat], [end.lng, end.lat]] 
            }
          });
        }
      }
    });
    return { type: 'FeatureCollection', features };
  }, [routes, selectedRouteId, sentinelMode, activeTrigger]);

  return (
    <div className="absolute inset-0 z-0">
      <Map
        initialViewState={{
          longitude: 77.4404,
          latitude: 12.6389,
          zoom: 11,
          pitch: 0,
          bearing: 0
        }}
        style={{ width: '100vw', height: '100vh' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        interactive={true}
        interactiveLayerIds={['sentinel-glow', 'sentinel-core', 'standard-line']}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            const clickedRouteId = e.features[0].properties?.routeId;
            if (clickedRouteId) {
              onSelectRoute(clickedRouteId);
            }
          }
        }}
      >
        <NavigationControl position="top-right" />
        <MapController tacticalMode={tacticalMode} destination={destination} routes={routes} selectedRouteId={selectedRouteId} />

        <Source id="routes" type="geojson" data={geojsonData}>
          <Layer 
            id="standard-line" 
            type="line" 
            filter={['==', 'mode', 'standard']}
            paint={{
              'line-color': ['get', 'color'],
              'line-width': ['get', 'width'],
              'line-opacity': ['get', 'opacity']
            }} 
          />
          <Layer 
            id="sentinel-glow" 
            type="line" 
            filter={['==', 'mode', 'sentinel']}
            paint={{
              'line-color': ['get', 'color'],
              'line-width': ['*', 15, ['get', 'widthMultiplier']],
              'line-opacity': ['*', 0.4, ['get', 'opacity']],
              'line-blur': 8
            }} 
          />
          <Layer 
            id="sentinel-core" 
            type="line" 
            filter={['==', 'mode', 'sentinel']}
            paint={{
              'line-color': ['get', 'color'],
              'line-width': ['*', 4, ['get', 'widthMultiplier']],
              'line-opacity': ['get', 'opacity']
            }} 
          />
        </Source>

        {/* Source Marker */}
        {!tacticalMode && source && (
          <Marker longitude={source.lng} latitude={source.lat} anchor="center">
            <div className="h-4 w-4 rounded-full border-2 border-white bg-[var(--color-emerald)] shadow-[0_0_10px_rgba(0,255,65,0.8)]" />
          </Marker>
        )}

        {/* Spatial Anchor for Tactical Mode */}
        {tacticalMode && destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="relative flex flex-col items-center">
              <div className="mb-2 rounded border border-[var(--color-emerald)] bg-[rgba(0,0,0,0.8)] p-2 font-mono text-[10px] text-[var(--color-emerald)] shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                TARGET_ACQUIRED<br/>
                STRUCTURAL_ENTRY_CONFIRMED
              </div>
              <div className="h-4 w-4 animate-ping rounded-full bg-[var(--color-emerald)] opacity-75" />
              <div className="absolute top-[36px] h-3 w-3 rounded-full bg-[var(--color-emerald)]" />
              <svg className="absolute top-[48px] h-24 w-2 overflow-visible">
                <line x1="4" y1="0" x2="4" y2="96" stroke="var(--color-emerald)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Contextual Badge for Recommended Route */}
        {!tacticalMode && destination && sentinelMode && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="rounded border border-[var(--color-amber)] bg-[rgba(0,0,0,0.9)] px-3 py-1 font-mono text-[10px] font-bold text-[var(--color-amber)] shadow-[0_0_10px_rgba(255,176,0,0.2)] mb-4">
              AGENT PREFERRED: 92% CERTAINTY
            </div>
          </Marker>
        )}
      </Map>
      
      {/* Overlay for Sentinel Mode Glow Effect */}
      {sentinelMode && !tacticalMode && (
        <div className="pointer-events-none absolute inset-0 z-10 mix-blend-screen shadow-[inset_0_0_100px_rgba(0,255,65,0.1)]" />
      )}
    </div>
  );
}

