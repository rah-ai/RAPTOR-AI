/* ─── RAPTOR Risk Gauge v2 — Animated arc gauge with premium styling ─── */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskScore } from '../../types/raptor';

interface Props {
  risk: RiskScore;
  aircraftCount: number;
}

const RISK_COLORS: Record<string, { fill: string; bg: string; glow: string }> = {
  LOW: { fill: 'var(--risk-low)', bg: 'var(--risk-low-bg)', glow: 'rgba(27, 107, 58, 0.3)' },
  MODERATE: { fill: 'var(--risk-moderate)', bg: 'var(--risk-moderate-bg)', glow: 'rgba(139, 105, 20, 0.3)' },
  HIGH: { fill: 'var(--risk-high)', bg: 'var(--risk-high-bg)', glow: 'rgba(184, 35, 58, 0.3)' },
  EXTREME: { fill: 'var(--risk-extreme)', bg: 'var(--risk-extreme-bg)', glow: 'rgba(122, 16, 34, 0.4)' },
};

export default function RiskGauge({ risk, aircraftCount }: Props) {
  const colors = RISK_COLORS[risk.level] || RISK_COLORS.LOW;
  const score = Math.round(risk.score * 100);

  // Arc math
  const radius = 70;
  const strokeWidth = 8;
  const centerX = 90;
  const centerY = 85;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 degrees
  const fillAngle = startAngle + (totalAngle * risk.score);

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
  const fillArc = describeArc(centerX, centerY, radius, startAngle, Math.max(startAngle + 1, fillAngle));

  // Risk factors breakdown
  const factors = useMemo(() => {
    if (!risk.factors || !Array.isArray(risk.factors)) return [];
    return risk.factors
      .filter(f => f.contribution > 0)
      .map(f => ({
        label: f.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: Math.round(f.contribution * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [risk.factors]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <h4>Bird Strike Risk</h4>
        <span className={`risk-badge risk-badge-${risk.level.toLowerCase()}`}>
          {risk.level}
        </span>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px' }}>
        {/* SVG Gauge */}
        <svg viewBox="0 0 180 120" style={{ width: '100%', maxWidth: '220px' }}>
          {/* Background arc */}
          <path d={bgArc} fill="none" stroke="var(--bg-sunken)" strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Animated fill arc */}
          <motion.path
            d={fillArc}
            fill="none"
            stroke={colors.fill}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />

          {/* Center score */}
          <text x={centerX} y={centerY - 8} textAnchor="middle" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '28px',
            fontWeight: 700,
            fill: 'var(--text-primary)',
          }}>
            {score}
          </text>
          <text x={centerX} y={centerY + 10} textAnchor="middle" style={{
            fontFamily: 'var(--font-body)',
            fontSize: '8px',
            fontWeight: 500,
            fill: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
          }}>
            RISK SCORE
          </text>
        </svg>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '4px',
          width: '100%',
          justifyContent: 'center',
        }}>
          {[
            { label: 'Aircraft', value: aircraftCount.toString() },
            { label: 'ML Score', value: risk.ml_score ? `${Math.round(risk.ml_score * 100)}%` : '—' },
            { label: 'Rule Score', value: risk.rule_based_score ? `${Math.round(risk.rule_based_score * 100)}%` : '—' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Risk factors */}
        {factors.length > 0 && (
          <div style={{
            marginTop: '14px',
            width: '100%',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '12px',
          }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
            }}>
              Risk Factors
            </div>
            {factors.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flex: 1 }}>{f.label}</span>
                <div style={{ width: '60px', height: '3px', background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.value}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: colors.fill, borderRadius: 2 }}
                  />
                </div>
                <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', minWidth: '24px', textAlign: 'right' }}>
                  {f.value}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
