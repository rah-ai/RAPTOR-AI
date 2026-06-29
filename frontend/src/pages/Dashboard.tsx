/* ─── RAPTOR Dashboard v2 — Responsive, polished, bug-free ─── */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/raptor';
import { useWebSocket } from '../hooks/useWebSocket';
import type { DashboardState } from '../types/raptor';

import StatusBar from '../components/dashboard/StatusBar';
import AlertBanner from '../components/dashboard/AlertBanner';
import AircraftMap from '../components/dashboard/AircraftMap';
import RiskGauge from '../components/dashboard/RiskGauge';
import WeatherPanel from '../components/dashboard/WeatherPanel';
import ForecastChart from '../components/dashboard/ForecastChart';
import AircraftTable from '../components/dashboard/AircraftTable';
import AlertFeed from '../components/dashboard/AlertFeed';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Dashboard({ theme, toggleTheme }: Props) {
  const { icao } = useParams<{ icao: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  const { status: wsStatus, liveState } = useWebSocket(!!state);

  // Load airport on mount or ICAO change
  useEffect(() => {
    if (!icao) return;
    loadAirport(icao);
  }, [icao]);

  // Merge WebSocket updates into state
  useEffect(() => {
    if (liveState && state) {
      setState(prev => prev ? {
        ...prev,
        aircraft: liveState.aircraft,
        weather: liveState.weather ?? prev.weather,
        overall_risk: liveState.overall_risk,
        forecast: liveState.forecast,
        aircraft_count: liveState.aircraft_count,
        last_updated: liveState.last_updated,
        opensky_cached: liveState.opensky_cached,
      } : prev);
    }
  }, [liveState]);

  // HTTP polling fallback if WebSocket disconnected
  useEffect(() => {
    if (wsStatus !== 'disconnected' || !state) return;
    const interval = setInterval(async () => {
      try {
        const live = await api.getLiveState();
        setState(prev => prev ? {
          ...prev,
          aircraft: live.aircraft,
          weather: live.weather ?? prev.weather,
          overall_risk: live.overall_risk,
          forecast: live.forecast,
          aircraft_count: live.aircraft_count,
          last_updated: live.last_updated,
        } : prev);
      } catch { /* silent */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [wsStatus, state]);

  // Poll alerts separately
  useEffect(() => {
    if (!state) return;
    const interval = setInterval(async () => {
      try {
        const alerts = await api.getAlerts();
        setState(prev => prev ? { ...prev, alerts } : prev);
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [state]);

  const loadAirport = async (code: string) => {
    setLoading(true);
    setError(null);
    setLoadProgress(0);

    // Simulate progress bar during API call
    const progressInterval = setInterval(() => {
      setLoadProgress(p => Math.min(p + Math.random() * 12, 88));
    }, 300);

    try {
      const dashState = await api.selectAirport(code);
      setLoadProgress(100);
      setTimeout(() => {
        setState(dashState);
        setLoading(false);
      }, 400); // brief pause for animation
    } catch (err: any) {
      setError(`Failed to load airport ${code}: ${err.message}`);
      setLoading(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleAirportSwitch = useCallback((newIcao: string) => {
    navigate(`/dashboard/${newIcao}`);
  }, [navigate]);

  // ─── Loading State ───
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Radar animation */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '1px solid var(--nav-active)',
              }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 40, height: 1,
              background: 'linear-gradient(90deg, var(--nav-active), transparent)',
              transformOrigin: '0 50%',
            }}
          />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--nav-active)',
          }} />
        </div>

        {/* Progress bar */}
        <div style={{ width: 200, height: 2, background: 'var(--border-default)', borderRadius: 1, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${loadProgress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'var(--nav-active)', borderRadius: 1 }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            CONNECTING TO {icao}
          </span>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, opacity: 0.5 }}>
            Loading weather · aircraft · risk analysis
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !state) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--risk-high-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
        }}>⚠</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Connection Failed
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320 }}>
            {error || 'Failed to load dashboard'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => icao && loadAirport(icao)}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--text-primary)',
              color: 'var(--text-inverse)',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.8rem',
            }}
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  const isExtreme = state.overall_risk.level === 'EXTREME';

  return (
    <div
      className={isExtreme ? 'extreme-border' : ''}
      style={{
        height: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Status Bar */}
      <StatusBar
        airport={state.airport}
        wsStatus={wsStatus}
        lastUpdated={state.last_updated}
        theme={theme}
        toggleTheme={toggleTheme}
        onAirportSwitch={handleAirportSwitch}
      />

      {/* Alert Banner */}
      <AlertBanner risk={state.overall_risk} />

      {/* Main Grid — responsive */}
      <div className="dashboard-grid" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gridTemplateRows: '1fr auto',
        gap: '12px',
        padding: '12px',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Left Column — Map + Table */}
        <div style={{
          gridRow: '1 / 3',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, minHeight: 0 }}
          >
            <AircraftMap
              airport={state.airport}
              aircraft={state.aircraft}
              corridors={state.approach_corridors}
              runways={state.runways}
              historicalStrikes={state.historical_strikes}
              historicalDataAvailable={state.historical_data_available}
              selectedAircraft={selectedAircraft}
              onSelectAircraft={setSelectedAircraft}
            />
          </motion.div>

          {/* Aircraft Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxHeight: '200px', overflow: 'auto', flexShrink: 0 }}
          >
            <AircraftTable
              aircraft={state.aircraft}
              selectedAircraft={selectedAircraft}
              onSelectAircraft={setSelectedAircraft}
            />
          </motion.div>
        </div>

        {/* Right Column — Panels */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'auto',
          minHeight: 0,
        }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <RiskGauge risk={state.overall_risk} aircraftCount={state.aircraft_count} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <WeatherPanel weather={state.weather} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <ForecastChart forecast={state.forecast} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <AlertFeed alerts={state.alerts} />
          </motion.div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr auto auto !important;
            overflow: auto !important;
          }
          .dashboard-grid > div:first-child {
            grid-row: auto !important;
            min-height: 400px !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid {
            padding: 8px !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
