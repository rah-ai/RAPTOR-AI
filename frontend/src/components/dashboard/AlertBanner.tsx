/* ─── RAPTOR Alert Banner v2 — Slim, animated, attention-grabbing ─── */

import { motion, AnimatePresence } from 'framer-motion';
import type { RiskScore } from '../../types/raptor';

interface Props {
  risk: RiskScore;
}

const BANNER_CONFIG: Record<string, { bg: string; text: string; message: string } | null> = {
  LOW: null,
  MODERATE: null,
  HIGH: {
    bg: 'var(--risk-high-bg)',
    text: 'var(--risk-high)',
    message: 'HIGH RISK — Active wildlife threat detected in approach corridors',
  },
  EXTREME: {
    bg: 'var(--risk-extreme-bg)',
    text: 'var(--risk-extreme)',
    message: 'EXTREME RISK — Immediate bird strike threat. Consider runway hold or dispersal.',
  },
};

export default function AlertBanner({ risk }: Props) {
  const config = BANNER_CONFIG[risk.level];

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: config.bg,
            borderBottom: '1px solid var(--border-default)',
          }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '0.8rem' }}
            >
              ⚠
            </motion.span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: config.text,
              letterSpacing: '0.06em',
            }}>
              {config.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
