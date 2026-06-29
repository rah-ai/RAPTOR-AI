/* ─── RAPTOR Forecast Chart v2 — Bar chart with risk coloring ─── */

import { motion } from 'framer-motion';
import type { ForecastEntry } from '../../types/raptor';

interface Props {
  forecast: ForecastEntry[];
}

const riskColor = (level: string) => {
  switch (level) {
    case 'LOW': return 'var(--risk-low)';
    case 'MODERATE': return 'var(--risk-moderate)';
    case 'HIGH': return 'var(--risk-high)';
    case 'EXTREME': return 'var(--risk-extreme)';
    default: return 'var(--text-muted)';
  }
};

export default function ForecastChart({ forecast }: Props) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="card">
        <div className="card-header"><h4>6-Hour Forecast</h4></div>
        <div className="card-body" style={{ padding: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            No forecast data available
          </span>
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...forecast.map(f => f.risk_score), 0.1);

  return (
    <div className="card">
      <div className="card-header">
        <h4>6-Hour Risk Forecast</h4>
        <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          PREDICTED
        </span>
      </div>

      <div className="card-body" style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '80px',
        }}>
          {forecast.slice(0, 13).map((entry, idx) => {
            const height = Math.max((entry.risk_score / maxScore) * 100, 4);
            const color = riskColor(entry.risk_level);
            const label = entry.label || '';
            // Extract just the time part (HH:MM)
            const timeLabel = label.includes('(')
              ? label.split('(')[0].trim()
              : label;

            return (
              <div key={idx} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                height: '100%',
                justifyContent: 'flex-end',
              }}>
                {/* Score */}
                <span className="mono" style={{
                  fontSize: '0.45rem',
                  color: 'var(--text-muted)',
                  opacity: 0.7,
                }}>
                  {Math.round(entry.risk_score * 100)}
                </span>

                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: '100%',
                    minHeight: '3px',
                    background: color,
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.85,
                    position: 'relative',
                  }}
                >
                  {/* Dawn/Dusk marker */}
                  {(entry.is_dawn || entry.is_dusk) && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.55rem',
                    }}>
                      {entry.is_dawn ? '🌅' : '🌇'}
                    </div>
                  )}
                </motion.div>

                {/* Time label */}
                <span className="mono" style={{
                  fontSize: '0.45rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {timeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
