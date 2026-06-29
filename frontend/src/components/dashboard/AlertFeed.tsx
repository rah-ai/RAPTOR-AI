/* ─── RAPTOR Alert Feed v2 — Compact timeline with risk badges ─── */

import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../../types/raptor';

interface Props {
  alerts: Alert[];
}

const severityIcon: Record<string, string> = {
  info: 'ℹ',
  warning: '⚠',
  critical: '🔴',
};

const severityColor: Record<string, string> = {
  info: 'var(--nav-active)',
  warning: 'var(--risk-moderate)',
  critical: 'var(--risk-high)',
};

export default function AlertFeed({ alerts }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card">
        <div className="card-header"><h4>Alert Feed</h4></div>
        <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No active alerts — airspace clear
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4>Alert Feed</h4>
        <span className="mono" style={{
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
        </span>
      </div>

      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {alerts.slice(0, 10).map((alert, idx) => {
            const color = severityColor[alert.severity] || severityColor.info;
            const icon = severityIcon[alert.severity] || '•';

            return (
              <motion.div
                key={alert.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '0.7rem', flexShrink: 0, marginTop: '1px' }}>
                  {icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {alert.title && (
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}>
                      {alert.title}
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    {alert.message}
                  </div>
                  <div className="mono" style={{
                    fontSize: '0.55rem',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                  }}>
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                    }) : '--:--'}
                    {alert.aircraft_callsign && (
                      <span style={{ marginLeft: '8px' }}>✈ {alert.aircraft_callsign}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: '4px',
                  height: '24px',
                  borderRadius: '2px',
                  background: color,
                  opacity: 0.5,
                  flexShrink: 0,
                }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
