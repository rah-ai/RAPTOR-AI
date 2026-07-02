/* ─── RAPTOR Hero v2 — Apple-level cinematic reveal with parallax ─── */

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAirportSearch } from '../../hooks/useAirportSearch';
import type { Airport } from '../../types/raptor';

interface Props {
  onAirportSelect: (icao: string) => void;
}

/* Staggered word animation */
function AnimatedHeadline({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.3em' }}>
      {words.map((word, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block', padding: '0.2em 0.15em', margin: '-0.2em -0.15em' }}>
          <motion.span
            initial={{ y: '110%', rotateX: 20 }}
            animate={{ y: '0%', rotateX: 0 }}
            transition={{
              duration: 1.0,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ display: 'inline-block', transformOrigin: 'bottom' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* Floating particle dots */
function FloatingDots() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 10,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            opacity: [0, 0.25, 0.15, 0],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: 'var(--text-primary)',
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection({ onAirportSelect }: Props) {
  const { query, results, isLoading, setQuery, clearResults } = useAirportSearch();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleSelect = (airport: Airport) => {
    clearResults();
    onAirportSelect(airport.icao);
  };

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(100px, 15vh, 160px) clamp(16px, 5vw, 48px) clamp(60px, 10vh, 120px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingDots />

      <motion.div style={{ y: backgroundY, opacity, position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(20px, 3vh, 32px)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-xs)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
            }}
          >
            <span className="status-dot status-dot-live" />
            Tata InnoVent-27 · Aerospace · Edge AI
          </span>
        </motion.div>

        {/* Main Headlines — big, editorial, cinematic */}
        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(2.5rem, 7.5vw, 6rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            marginBottom: 'clamp(8px, 1.5vh, 16px)',
          }}>
            <AnimatedHeadline text="Predicting bird strikes" delay={0.3} />
          </h1>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: 'clamp(2.5rem, 7.5vw, 6rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
          }}>
            <AnimatedHeadline text="before they happen." delay={0.6} />
          </h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            textAlign: 'center',
            maxWidth: '560px',
            margin: 'clamp(20px, 3vh, 36px) auto 0',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          RAPTOR fuses live ADS-B radar, real-time weather, and 340,000+ historical
          wildlife strike records to deliver per-aircraft risk scores — updated every 15 seconds.
        </motion.p>

        {/* Search Box — the hero interaction */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 'clamp(28px, 4vh, 48px)',
            width: '100%',
            maxWidth: '500px',
            margin: 'clamp(28px, 4vh, 48px) auto 0',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <motion.div
            animate={isFocused ? {
              boxShadow: '0 0 0 3px rgba(27, 58, 92, 0.12), 0 8px 24px rgba(0,0,0,0.06)',
            } : {
              boxShadow: 'var(--shadow-md)',
            }}
            style={{
              position: 'relative',
              border: `1.5px solid ${isFocused ? 'var(--nav-active)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              transition: 'border-color 0.3s ease',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="Search any airport — VABB, Mumbai, JFK, Delhi..."
                style={{
                  width: '100%',
                  padding: '18px 14px',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}
              />
              {isLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 18, height: 18,
                    border: '2px solid var(--border-default)',
                    borderTopColor: 'var(--nav-active)',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Search Results */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '340px',
                overflowY: 'auto',
                zIndex: 100,
              }}
            >
              {results.map((airport, idx) => (
                <motion.button
                  key={airport.icao}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.025 }}
                  onClick={() => handleSelect(airport)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 20px',
                    textAlign: 'left',
                    borderBottom: idx < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="mono"
                    style={{
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: 'var(--nav-active)',
                      minWidth: '50px',
                    }}
                  >
                    {airport.icao}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {airport.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {airport.city}{airport.country ? `, ${airport.country}` : ''}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 1.0 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(24px, 4vw, 48px)',
            marginTop: 'clamp(40px, 6vh, 72px)',
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '288,810', label: 'FAA Strike Records' },
            { value: '15s', label: 'Update Interval' },
            { value: '3', label: 'Live Data Sources' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.03em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        style={{
          position: 'absolute',
          bottom: 'clamp(24px, 4vh, 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.65rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Discover
        </span>
        <motion.svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.div>
    </section>
  );
}
