/* ─── RAPTOR Aircraft Table v2 — Compact, sortable, risk-coded ─── */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AircraftRisk } from '../../types/raptor';
import { getRiskColor, formatCallsign, formatAltitude, formatSpeed, formatPhase, scoreToPercent } from '../../utils/riskColors';

interface Props {
  aircraft: AircraftRisk[];
  selectedAircraft: string | null;
  onSelectAircraft: (callsign: string | null) => void;
}

type SortKey = 'callsign' | 'risk' | 'altitude' | 'speed' | 'phase';

export default function AircraftTable({ aircraft, selectedAircraft, onSelectAircraft }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('risk');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    let items = [...aircraft].filter(a => !a.aircraft.on_ground);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(a => a.aircraft.callsign.toLowerCase().includes(q) || a.aircraft.icao24.toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'callsign': cmp = a.aircraft.callsign.localeCompare(b.aircraft.callsign); break;
        case 'risk': cmp = a.risk.score - b.risk.score; break;
        case 'altitude': cmp = a.aircraft.altitude_ft - b.aircraft.altitude_ft; break;
        case 'speed': cmp = a.aircraft.velocity_kts - b.aircraft.velocity_kts; break;
        case 'phase': cmp = a.aircraft.phase.localeCompare(b.aircraft.phase); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [aircraft, sortBy, sortAsc, searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const columns: { key: SortKey; label: string; width: string }[] = [
    { key: 'callsign', label: 'FLIGHT', width: '25%' },
    { key: 'risk', label: 'RISK', width: '18%' },
    { key: 'altitude', label: 'ALT', width: '18%' },
    { key: 'speed', label: 'SPD', width: '18%' },
    { key: 'phase', label: 'PHASE', width: '21%' },
  ];

  if (sorted.length === 0) {
    return (
      <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          No airborne aircraft detected
        </span>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}>
        <input 
          type="text" 
          placeholder="Search Flight (e.g. AWE1549)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
            borderRadius: '4px',
            padding: '6px 10px',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Header Row */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-sunken)',
      }}>
        {columns.map(col => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            style={{
              width: col.width,
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              fontWeight: 600,
              color: sortBy === col.key ? 'var(--text-primary)' : 'var(--text-muted)',
              letterSpacing: '0.1em',
              textAlign: 'left',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {col.label}
            {sortBy === col.key && (
              <span style={{ fontSize: '0.5rem' }}>{sortAsc ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
        {sorted.map((ar) => {
          const ac = ar.aircraft;
          const cs = ac.callsign.trim();
          const isSelected = selectedAircraft === cs;
          const color = getRiskColor(ar.risk.level);

          return (
            <motion.div
              key={ac.icao24}
              onClick={() => onSelectAircraft(isSelected ? null : cs)}
              whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
              style={{
                display: 'flex',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                transition: 'background 0.15s ease, border-left 0.15s ease',
              }}
            >
              <div style={{ width: '25%', padding: '7px 10px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatCallsign(cs)}
                </span>
              </div>
              <div style={{ width: '18%', padding: '7px 4px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color }}>
                  {scoreToPercent(ar.risk.score)}%
                </span>
              </div>
              <div style={{ width: '18%', padding: '7px 4px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                  {formatAltitude(ac.altitude_ft)}
                </span>
              </div>
              <div style={{ width: '18%', padding: '7px 4px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                  {formatSpeed(ac.velocity_kts)}
                </span>
              </div>
              <div style={{ width: '21%', padding: '7px 4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {formatPhase(ac.phase)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
