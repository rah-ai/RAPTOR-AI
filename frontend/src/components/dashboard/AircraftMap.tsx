/* ─── RAPTOR Aircraft Map v3 — Satellite toggle, no watermarks, z-index fixes ─── */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Airport, AircraftRisk, ApproachCorridor, Runway, HistoricalStrike } from '../../types/raptor';
import { getRiskColor, formatCallsign, formatAltitude, formatSpeed, formatPhase, scoreToPercent } from '../../utils/riskColors';

interface Props {
  airport: Airport | null;
  aircraft: AircraftRisk[];
  corridors: ApproachCorridor[];
  runways: Runway[];
  historicalStrikes: HistoricalStrike[];
  historicalDataAvailable: boolean;
  selectedAircraft: string | null;
  onSelectAircraft: (callsign: string | null) => void;
}

/* ─── Airplane SVG icon — proper aircraft silhouette ─── */
function createAircraftIcon(heading: number, riskColor: string, isSelected: boolean, callsign: string): L.DivIcon {
  const size = isSelected ? 36 : 28;
  const labelOffset = size / 2 + 4;

  const planeSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
      <g transform="rotate(${heading}, 16, 16)">
        <path d="
          M16 3
          L17.5 12
          L27 16
          L17.5 17
          L18.5 26
          L16 24
          L13.5 26
          L14.5 17
          L5 16
          L14.5 12
          Z
        " fill="${riskColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"
          style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35));"
        />
      </g>
    </svg>
  `;

  const label = callsign || '';
  const html = `
    <div style="position:relative; width:${size}px; height:${size}px;">
      ${planeSvg}
      ${label ? `
        <div style="
          position: absolute;
          top: ${labelOffset}px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          color: ${riskColor};
          white-space: nowrap;
          text-shadow: 0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9);
          letter-spacing: 0.02em;
          pointer-events: none;
        ">${label}</div>
      ` : ''}
      ${isSelected ? `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size + 16}px;
          height: ${size + 16}px;
          border: 2px solid ${riskColor};
          border-radius: 50%;
          opacity: 0.4;
          animation: selectedPulse 2s ease-in-out infinite;
          pointer-events: none;
        "></div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html,
  });
}

/* ─── Airport marker — crosshair ─── */
function createAirportIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="4" fill="none" stroke="#1B3A5C" stroke-width="2"/>
        <circle cx="10" cy="10" r="1.5" fill="#1B3A5C"/>
        <line x1="10" y1="2" x2="10" y2="6" stroke="#1B3A5C" stroke-width="1.5"/>
        <line x1="10" y1="14" x2="10" y2="18" stroke="#1B3A5C" stroke-width="1.5"/>
        <line x1="2" y1="10" x2="6" y2="10" stroke="#1B3A5C" stroke-width="1.5"/>
        <line x1="14" y1="10" x2="18" y2="10" stroke="#1B3A5C" stroke-width="1.5"/>
      </svg>
    `,
  });
}

/* ─── Bird Swarm Icon ─── */
function createBirdIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); animation: pulse 1s infinite alternate;">
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 14c2.5-4 7-5 9-2 2-3 6.5-2 9 2-2 1-5 1-6.5-1-1.5-2-3-2-4 0-1.5 2-4.5 2-6.5 1z" fill="#C9303E" stroke="white" stroke-width="1" />
          <path d="M5 10c2-3 5-4 7-1 2-3 5-2 7 1-1.5.5-4 .5-5-1-1-1.5-2-1.5-3 0-1 1.5-3.5 1.5-5 1z" fill="#C9303E" opacity="0.6" stroke="white" stroke-width="0.5" />
        </svg>
      </div>
    `,
  });
}

/* ─── Re-center map ─── */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center[0], center[1]]);
  return null;
}

/* ─── Tile URLs ─── */
const TILES = {
  street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  labels: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
};

export default function AircraftMap({
  airport, aircraft,
  historicalStrikes, historicalDataAvailable,
  selectedAircraft, onSelectAircraft,
}: Props) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const center: [number, number] = airport
    ? [airport.latitude, airport.longitude]
    : [20.5937, 78.9629];

  return (
    <div className="card" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Map Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        {/* Map Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          {(['street', 'satellite'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setMapMode(mode)}
              style={{
                padding: '5px 8px',
                fontSize: '0.55rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: mapMode === mode ? 'var(--text-primary)' : 'transparent',
                color: mapMode === mode ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {mode === 'street' ? 'MAP' : 'SAT'}
            </button>
          ))}
        </div>

        {historicalDataAvailable && (
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              padding: '5px 8px',
              background: showHeatmap ? 'var(--nav-active)' : 'var(--bg-card)',
              color: showHeatmap ? '#FFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.55rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {showHeatmap ? '● STRIKES' : '○ STRIKES'}
          </button>
        )}

        <div style={{
          padding: '5px 8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
          letterSpacing: '0.06em',
        }}>
          {aircraft.filter(a => !a.aircraft.on_ground).length} ✈ LIVE
        </div>
      </div>

      {/* Legend — bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        zIndex: 1000,
        padding: '6px 10px',
        background: mapMode === 'satellite' ? 'rgba(0,0,0,0.6)' : 'var(--bg-glass)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${mapMode === 'satellite' ? 'rgba(255,255,255,0.1)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        gap: '10px',
        fontSize: '0.52rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: mapMode === 'satellite' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
      }}>
        {[
          { color: 'var(--risk-low)', label: 'LOW' },
          { color: 'var(--risk-moderate)', label: 'MOD' },
          { color: 'var(--risk-high)', label: 'HIGH' },
          { color: 'var(--risk-extreme)', label: 'EXT' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="8" height="8" viewBox="0 0 32 32">
              <path d="M16 3 L17.5 12 L27 16 L17.5 17 L18.5 26 L16 24 L13.5 26 L14.5 17 L5 16 L14.5 12 Z" fill={item.color} />
            </svg>
            {item.label}
          </div>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={center} zoom={11} />

        {/* Base tile layer */}
        <TileLayer
          key={mapMode}
          url={mapMode === 'satellite' ? TILES.satellite : TILES.street}
        />

        {/* Labels overlay on satellite */}
        {mapMode === 'satellite' && (
          <TileLayer url={TILES.labels} />
        )}


        {/* Corridors hidden — aircraft icons and risk colors convey all needed info */}

        {/* Historical Strikes */}
        {showHeatmap && historicalStrikes.map((strike, idx) => (
          strike.latitude && strike.longitude ? (
            <CircleMarker
              key={`strike-${idx}`}
              center={[strike.latitude, strike.longitude]}
              radius={3}
              pathOptions={{
                color: 'transparent',
                fillColor: '#E63946',
                fillOpacity: 0.4,
              }}
            />
          ) : null
        ))}

        {/* Airport Marker */}
        {airport && (
          <Marker
            position={[airport.latitude, airport.longitude]}
            icon={createAirportIcon()}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-body)' }}>
                <strong>{airport.icao}</strong> — {airport.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Aircraft Markers */}
        {aircraft.map((ar) => {
          const ac = ar.aircraft;
          if (!ac.latitude || !ac.longitude) return null;
          const color = getRiskColor(ar.risk.level);
          const cs = (ac.callsign || '').trim();
          const isSelected = selectedAircraft === cs;
          const isExtreme = ar.risk.level === 'EXTREME';

          // Simulate bird flocks directly in front of the aircraft's path
          const birdFlocks = isExtreme ? [1, 2, 3].map(i => {
            const hdgRad = ac.heading * (Math.PI / 180);
            const dist = 0.015 + (i * 0.008); 
            const bLat = ac.latitude! + (Math.cos(hdgRad) * dist);
            const bLon = ac.longitude! + (Math.sin(hdgRad) * dist);
            return [bLat, bLon] as [number, number];
          }) : [];

          return (
            <LayerGroup key={ac.icao24}>
              {birdFlocks.map((pos, idx) => (
                <Marker key={`${ac.icao24}-bird-${idx}`} position={pos} icon={createBirdIcon()} zIndexOffset={1000} />
              ))}
              <Marker
                position={[ac.latitude, ac.longitude]}
                icon={createAircraftIcon(ac.heading, color, isSelected, cs)}
                eventHandlers={{ click: () => onSelectAircraft(cs) }}
                zIndexOffset={isExtreme ? 900 : 0}
              >
              <Popup maxWidth={300}>
                <div style={{ fontFamily: 'var(--font-body)', minWidth: '230px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCallsign(cs)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>{ac.origin_country} · {ac.icao24.toUpperCase()}</div>
                    </div>
                    <div style={{
                      padding: '3px 8px', borderRadius: '4px',
                      background: `${color}18`, fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem', fontWeight: 700, color,
                    }}>
                      {scoreToPercent(ar.risk.score)}%
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                    {[
                      { l: 'ALT', v: formatAltitude(ac.altitude_ft) },
                      { l: 'SPD', v: formatSpeed(ac.velocity_kts) },
                      { l: 'HDG', v: `${Math.round(ac.heading)}°` },
                      { l: 'PHASE', v: formatPhase(ac.phase) },
                    ].map(d => (
                      <div key={d.l}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#aaa', letterSpacing: '0.1em' }}>{d.l}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, marginTop: '1px' }}>{d.v}</div>
                      </div>
                    ))}
                  </div>
                  {ac.vertical_rate_fpm !== 0 && (
                    <div style={{
                      padding: '4px 8px', background: '#f5f5f5', borderRadius: '3px',
                      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginBottom: '6px',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span style={{ color: '#888' }}>V/S</span>
                      <span style={{ fontWeight: 600, color: ac.vertical_rate_fpm > 0 ? '#1B6B3A' : '#B8233A' }}>
                        {ac.vertical_rate_fpm > 0 ? '▲' : '▼'} {Math.abs(Math.round(ac.vertical_rate_fpm))} ft/min
                      </span>
                    </div>
                  )}
                  {ar.risk.factors.length > 0 && (
                    <div style={{ paddingTop: '6px', borderTop: '1px solid #eee' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#aaa', letterSpacing: '0.1em', marginBottom: '4px' }}>RISK FACTORS</div>
                      {ar.risk.factors.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                          <span style={{ color: '#555' }}>{f.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{Math.round(f.contribution * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee', display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#aaa' }}>
                    <span>RULE: {scoreToPercent(ar.risk.rule_based_score)}%</span>
                    <span>ML: {scoreToPercent(ar.risk.ml_score)}%</span>
                  </div>
                </div>
              </Popup>
              </Marker>
            </LayerGroup>
          );
        })}
      </MapContainer>

      {/* Animation + hide attribution */}
      <style>{`
        @keyframes selectedPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
