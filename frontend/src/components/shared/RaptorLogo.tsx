/* ─── RAPTOR Logo v3 — Clean geometric eagle shield ───
   A refined, professional mark: geometric eagle head
   within a hexagonal shield. Minimal strokes,
   no radar/circle clutter. Feels like a defense company logo.
─── */

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  color?: string;
  showText?: boolean;
  animated?: boolean;
  variant?: 'full' | 'mark' | 'wordmark';
}

export default function RaptorLogo({
  size = 40,
  color = 'currentColor',
  showText = true,
  animated = true,
  variant = 'full',
}: Props) {
  const markSize = size;
  const textSize = size * 0.55;

  const Mark = () => (
    <motion.div 
      initial={animated ? { opacity: 0, scale: 0.9 } : {}}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: markSize, height: markSize }}
    >
      <img 
        src="/raptor_logo.png" 
        alt="RAPTOR Logo" 
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
      />
    </motion.div>
  );

  const Wordmark = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: `${textSize}px`,
          lineHeight: 1,
          letterSpacing: '0.08em',
          color,
        }}
      >
        RAPTOR
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: `${textSize * 0.26}px`,
          letterSpacing: '0.22em',
          color,
          opacity: 0.45,
          marginTop: '2px',
          textTransform: 'uppercase',
        }}
      >
        Avian Threat Operations
      </span>
    </div>
  );

  if (variant === 'mark') return <Mark />;
  if (variant === 'wordmark') return <Wordmark />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${size * 0.25}px` }}>
      <Mark />
      {showText && <Wordmark />}
    </div>
  );
}
