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
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Shield outline — hexagonal shape */}
      <motion.path
        d="M 32 4 L 56 16 L 56 40 L 32 60 L 8 40 L 8 16 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Eagle head silhouette — angular, geometric, facing right */}
      <motion.path
        d={`
          M 20 32
          C 20 25, 26 19, 32 17
          C 36 16, 40 17, 43 20
          L 50 17
          L 44 22
          C 45 24, 46 27, 45 30
          C 44 34, 40 38, 34 40
          C 28 42, 22 38, 20 32
          Z
        `}
        fill={color}
        initial={animated ? { opacity: 0, y: 4 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Eye — sharp predator focus */}
      <motion.circle
        cx="33"
        cy="26"
        r="2.5"
        fill="var(--bg-page, #F6F5F1)"
        initial={animated ? { opacity: 0, scale: 0 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />
      <circle cx="33" cy="26" r="1.2" fill={color} />

      {/* Beak accent */}
      <motion.path
        d="M 43 20 L 50 17 L 44 22 Z"
        fill={color}
        initial={animated ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.6 }}
      />

      {/* Scan line — subtle rotating indicator inside shield */}
      <motion.line
        x1="32"
        y1="32"
        x2="32"
        y2="8"
        stroke={color}
        strokeWidth="0.5"
        opacity={0.12}
        strokeLinecap="round"
        initial={animated ? { rotate: 0 } : {}}
        animate={animated ? { rotate: 360 } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 1 }}
        style={{ transformOrigin: '32px 32px' }}
      />
    </svg>
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
