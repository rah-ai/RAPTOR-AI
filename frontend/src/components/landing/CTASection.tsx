/* ─── RAPTOR CTA Section v2 — Dark cinematic with radar sweep ─── */

import { motion } from 'framer-motion';
import { useAirportSearch } from '../../hooks/useAirportSearch';
import type { Airport } from '../../types/raptor';
import RaptorLogo from '../shared/RaptorLogo';

interface Props {
  onAirportSelect: (icao: string) => void;
}

export default function CTASection({ onAirportSelect }: Props) {
  const { query, results, setQuery, clearResults } = useAirportSearch();

  const handleSelect = (airport: Airport) => {
    clearResults();
    onAirportSelect(airport.icao);
  };

  return (
    <section
      style={{
        background: '#0A0B0D',
        color: '#FFFFFF',
        padding: 'clamp(80px, 15vw, 180px) clamp(16px, 5vw, 48px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Concentric radar rings */}
      {[200, 350, 500].map((size, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.025 - i * 0.005})`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Rotating sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '250px',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(45,163,92,0.12), transparent)',
          transformOrigin: '0 50%',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}
        >
          <RaptorLogo size={44} color="#FFFFFF" variant="mark" animated={true} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            lineHeight: 1.1,
          }}
        >
          See it{' '}
          <span style={{ fontStyle: 'italic' }}>live.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)',
            color: 'rgba(255,255,255,0.45)',
            marginTop: '20px',
            lineHeight: 1.75,
          }}
        >
          Enter any airport code. Watch real aircraft appear on a live map
          with real-time bird strike risk scores. No simulation — every data point is real.
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            position: 'relative',
            maxWidth: '420px',
            margin: 'clamp(24px, 4vh, 40px) auto 0',
          }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="VABB, KJFK, VIDP, EGLL..."
            style={{
              width: '100%',
              padding: '16px 24px',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.05)';
            }}
            onBlur={e => {
              setTimeout(() => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                e.target.style.boxShadow = 'none';
              }, 200);
            }}
          />

          {results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: '#1A1B1E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              maxHeight: '260px',
              overflowY: 'auto',
              zIndex: 100,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}>
              {results.map((airport, idx) => (
                <button
                  key={airport.icao}
                  onClick={() => handleSelect(airport)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 20px',
                    textAlign: 'left',
                    borderBottom: idx < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: 'transparent',
                    color: '#FFF',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="mono" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#2DA35C', minWidth: '50px' }}>
                    {airport.icao}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{airport.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                      {airport.city}{airport.country ? `, ${airport.country}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 'clamp(48px, 6vh, 80px)',
          }}
        >
          Tata InnoVent-27 · Aerospace · Edge AI
        </motion.p>
      </div>
    </section>
  );
}
