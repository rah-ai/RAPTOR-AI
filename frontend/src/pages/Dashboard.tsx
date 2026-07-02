/* ─── RAPTOR Dashboard v2 — Responsive, polished, bug-free ─── */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/raptor';
import { useWebSocket } from '../hooks/useWebSocket';
import type { DashboardState } from '../types/raptor';
import { DEMO_AIRPORT_ICAO } from '../utils/demoState';

import StatusBar from '../components/dashboard/StatusBar';
import AlertBanner from '../components/dashboard/AlertBanner';
import AircraftMap from '../components/dashboard/AircraftMap';
import RiskGauge from '../components/dashboard/RiskGauge';
import WeatherPanel from '../components/dashboard/WeatherPanel';
import DefensePanel from '../components/dashboard/DefensePanel';
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { status: wsStatus, liveState } = useWebSocket(!!state);

  // Load airport on mount or ICAO change
  useEffect(() => {
    if (!icao) return;
    if (isDemoMode) return; // loadDemo handles fetching in demo mode
    loadAirport(icao);
  }, [icao, isDemoMode]);

  // Merge WebSocket updates into state
  useEffect(() => {
    if (isDemoMode) return; // Prevent live updates from overwriting demo
    const activeLiveState = liveState;
    if (activeLiveState && state) {
      setState(prev => prev ? {
        ...prev,
        aircraft: activeLiveState.aircraft,
        weather: activeLiveState.weather ?? prev.weather,
        overall_risk: activeLiveState.overall_risk,
        forecast: activeLiveState.forecast,
        aircraft_count: activeLiveState.aircraft_count,
        last_updated: activeLiveState.last_updated,
        opensky_cached: activeLiveState.opensky_cached,
      } : prev);
    }
  }, [liveState, isDemoMode, state?.airport?.icao]);

  // HTTP polling fallback if WebSocket disconnected
  useEffect(() => {
    if (wsStatus !== 'disconnected' || !state || isDemoMode) return;
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
    if (!state || isDemoMode) return;
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

  const loadDemo = async () => {
    setIsDemoMode(true);
    setLoading(true);
    setError(null);
    setLoadProgress(0);

    const progressInterval = setInterval(() => {
      setLoadProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 200);

    try {
      // 1. Fetch base airport state for KLGA
      const dashState = await api.selectAirport(DEMO_AIRPORT_ICAO);
      // 2. Fetch ML processed demo state
      const demoLiveState = await api.getDemoState();
      
      setLoadProgress(100);
      
      setTimeout(() => {
        // 3. Merge and inject critical alert
        setState({
          ...dashState,
          aircraft: demoLiveState.aircraft,
          weather: demoLiveState.weather ?? dashState.weather,
          overall_risk: demoLiveState.overall_risk,
          forecast: demoLiveState.forecast,
          aircraft_count: demoLiveState.aircraft_count,
          last_updated: demoLiveState.last_updated,
          opensky_cached: demoLiveState.opensky_cached,
          alerts: [{
            id: 'demo-alert-1549',
            timestamp: demoLiveState.last_updated || new Date().toISOString(),
            severity: 'critical',
            title: 'MULTIPLE BIRD STRIKES DETECTED',
            message: 'CRITICAL: Flight AWE1549 has encountered a dense flock of Canada Geese at 2800ft. Dual engine failure reported.',
            risk_level: 'EXTREME',
            aircraft_callsign: 'AWE1549'
          }]
        });

        // Trigger the massive global popup + audio siren for the demo pitch
        window.dispatchEvent(new CustomEvent('demo_alert', {
          detail: {
            aircraft_callsign: 'AWE1549',
            risk_score: 0.99,
            message: 'CRITICAL: Flight AWE1549 has encountered a dense flock of Canada Geese at 2800ft. Dual engine failure reported.'
          }
        }));

        navigate(`/dashboard/${DEMO_AIRPORT_ICAO}`);
        setLoading(false);
      }, 400);

    } catch (err: any) {
      console.error('Failed to load ML demo data:', err);
      setError(`Failed to load Demo Simulation: ${err.message}`);
      setLoading(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleAirportSwitch = useCallback((newIcao: string) => {
    setIsDemoMode(false);
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
            CONNECTING TO {isDemoMode ? DEMO_AIRPORT_ICAO : icao}
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
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div style={{ background: 'var(--risk-extreme)', color: '#fff', textAlign: 'center', padding: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', zIndex: 3000 }}>
          ⚠ DEMO SIMULATION: US Airways Flight 1549 (Jan 15, 2009)
          <button onClick={() => setIsDemoMode(false)} style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: 4, color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>Exit Demo</button>
        </div>
      )}
      
      <StatusBar
        airport={state.airport}
        wsStatus={isDemoMode ? 'connected' : wsStatus}
        lastUpdated={state.last_updated}
        theme={theme}
        toggleTheme={toggleTheme}
        onAirportSwitch={handleAirportSwitch}
      />
      
      {!isDemoMode && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(80px)', zIndex: 2500 }}>
          <button
            onClick={() => {
              loadDemo();
            }}
            style={{
              background: 'var(--accent-live)',
              color: 'var(--text-inverse)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ▶ Run Demo Simulation (Flight 1549)
          </button>
        </div>
      )}

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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <DefensePanel overallRisk={state.overall_risk} />
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
