/* ─── RAPTOR How It Works v2 — Card-based with reveal animations ─── */

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Ingest live data',
    description: 'ADS-B transponder positions for every aircraft within 50km. METAR weather from aviationweather.gov. 340,000+ historical FAA wildlife strike records.',
    accent: 'var(--nav-active)',
  },
  {
    number: '02',
    title: 'Score the risk',
    description: 'Dual-layer engine: aviation-safety rule multipliers combined with a trained XGBoost ML model. Per-aircraft risk scores computed every 15 seconds.',
    accent: 'var(--risk-moderate)',
  },
  {
    number: '03',
    title: 'Alert the operator',
    description: 'Live map with heading-rotated aircraft icons, risk gauge, weather panel, 6-hour forecast chart, and instant alerts for high-risk approach corridors.',
    accent: 'var(--risk-high)',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(16px, 5vw, 48px)',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}
      >
        <span style={{
          display: 'inline-block',
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--nav-active)',
          marginBottom: '16px',
        }}>
          How It Works
        </span>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          color: 'var(--text-primary)',
        }}>
          Three layers of{' '}
          <span style={{ fontStyle: 'italic' }}>intelligence.</span>
        </h2>
      </motion.div>

      {/* Step Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.8,
              delay: idx * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.div
              whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                padding: 'clamp(28px, 3.5vw, 40px)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xs)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent line at top */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: step.accent,
                opacity: 0.6,
              }} />

              {/* Step number */}
              <span className="mono" style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
              }}>
                STEP {step.number}
              </span>

              {/* Title */}
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                marginTop: '12px',
                marginBottom: '16px',
              }}>
                {step.title}
              </h3>

              {/* Description */}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                flex: 1,
              }}>
                {step.description}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Tech stack row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginTop: 'clamp(32px, 4vw, 48px)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        {['OpenSky ADS-B', 'METAR Weather', 'FAA Wildlife DB', 'XGBoost ML', 'FastAPI', 'React + Leaflet'].map(tech => (
          <span
            key={tech}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
            }}
          >
            {tech}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
