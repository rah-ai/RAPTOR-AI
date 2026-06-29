/* ─── RAPTOR Status Bar v2 — Compact, premium, responsive ─── */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RaptorLogo from '../shared/RaptorLogo';
import { useAirportSearch } from '../../hooks/useAirportSearch';
import type { Airport } from '../../types/raptor';

interface Props {
  airport: Airport;
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  lastUpdated: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onAirportSwitch: (icao: string) => void;
}

export default function StatusBar({ airport, wsStatus, lastUpdated, theme, toggleTheme, onAirportSwitch }: Props) {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const { query, results, setQuery, clearResults } = useAirportSearch();

  const handleSelect = (a: Airport) => {
    clearResults();
    setShowSearch(false);
    onAirportSwitch(a.icao);
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch { return '--:--:--'; }
  };

  const statusColor = wsStatus === 'connected' ? 'var(--accent-live)' :
                       wsStatus === 'connecting' ? 'var(--risk-moderate)' : 'var(--accent-error)';
  const statusText = wsStatus === 'connected' ? 'LIVE' :
                     wsStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE';

  return (
    <div className="glass" style={{
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid var(--border-default)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 2000,
    }}>
      {/* Left: Logo + Airport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <RaptorLogo size={22} color="var(--text-primary)" animated={false} />
        </motion.div>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)' }} />

        {/* Airport Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="mono" style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {airport.icao}
          </span>
          <span className="airport-name" style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {airport.name}
          </span>
        </div>

        {/* Switch Airport Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSearch(!showSearch)}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            fontSize: '0.62rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'transparent',
          }}
        >
          Switch
        </motion.button>
      </div>

      {/* Center: Connection Status */}
      <div className="status-center" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor,
          boxShadow: wsStatus === 'connected' ? `0 0 6px ${statusColor}` : 'none',
          animation: wsStatus === 'connected' ? 'live-pulse 2.5s ease-in-out infinite' : 'none',
        }} />
        <span className="mono" style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          color: statusColor,
          letterSpacing: '0.12em',
        }}>
          {statusText}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>·</span>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          {formatTime(lastUpdated)}
        </span>
      </div>

      {/* Right: Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          style={{
            width: '28px', height: '28px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '◐' : '◑'}
        </motion.button>
      </div>

      {/* Airport Search Dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '56px',
              left: '16px',
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 3000,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search airports..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-sunken)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {results.map((a, idx) => (
                <button
                  key={a.icao}
                  onClick={() => handleSelect(a)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 16px',
                    textAlign: 'left',
                    borderBottom: idx < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="mono" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--nav-active)', minWidth: '45px' }}>
                    {a.icao}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {a.city}{a.country ? `, ${a.country}` : ''}
                    </div>
                  </div>
                </button>
              ))}
              {query.length >= 2 && results.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No airports found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .airport-name { display: none !important; }
          .status-center { display: none !important; }
        }
      `}</style>
    </div>
  );
}
