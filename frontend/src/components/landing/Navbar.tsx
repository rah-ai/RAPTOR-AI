/* ─── RAPTOR Navbar v2 — Glass morphism, premium ─── */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RaptorLogo from '../shared/RaptorLogo';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={scrolled ? 'glass' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 48px)',
        borderBottom: scrolled ? '1px solid var(--border-default)' : '1px solid transparent',
        transition: 'border-bottom 0.5s ease, background 0.5s ease',
      }}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <RaptorLogo size={32} color="var(--text-primary)" animated={false} />
      </motion.div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 3vw, 32px)' }}>
        {/* Nav Links — hidden on mobile */}
        <div style={{ display: 'flex', gap: '28px' }} className="nav-links-desktop">
          {[
            { label: 'The Problem', href: '#problem' },
            { label: 'How It Works', href: '#how-it-works' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                letterSpacing: '0.01em',
                transition: 'color 0.3s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Theme Toggle — minimal circle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
          }}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'light' ? '◐' : '◑'}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/dashboard/KJFK')}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '10px 22px',
            background: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.01em',
            boxShadow: 'var(--shadow-sm)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          Open Dashboard →
        </motion.button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
        }
      `}</style>
    </motion.nav>
  );
}
