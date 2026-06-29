/* ─── RAPTOR Problem Section v2 — Scroll reveal with counting animation ─── */

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

interface CounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  label: string;
  detail: string;
  index: number;
}

function AnimatedCounter({ end, prefix = '', suffix = '', duration = 2, label, detail, index }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        flex: '1 1 260px',
        textAlign: 'center',
        padding: 'clamp(24px, 3vw, 40px)',
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          marginTop: '14px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginTop: '6px',
          maxWidth: '240px',
          margin: '6px auto 0',
          lineHeight: 1.6,
        }}
      >
        {detail}
      </div>
    </motion.div>
  );
}

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="problem"
      ref={sectionRef}
      style={{
        padding: 'clamp(80px, 12vw, 160px) clamp(16px, 5vw, 48px)',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {/* Section Label */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}
      >
        <span
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--risk-high)',
            marginBottom: '16px',
          }}
        >
          The Problem
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            lineHeight: 1.12,
          }}
        >
          Bird strikes are aviation's{' '}
          <span style={{ fontStyle: 'italic' }}>unsolved</span>{' '}
          crisis.
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)',
          color: 'var(--text-secondary)',
          marginTop: '20px',
          maxWidth: '580px',
          margin: '20px auto 0',
          lineHeight: 1.7,
        }}>
          Every year, collisions between aircraft and wildlife cause billions in damage,
          endanger passengers, and ground flights worldwide.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <AnimatedCounter end={1200} prefix="$" suffix="M" label="Annual Cost" detail="Global economic damage to aviation every year" index={0} />
        <div style={{ width: '1px', background: 'var(--border-default)', alignSelf: 'stretch', margin: '20px 0' }} />
        <AnimatedCounter end={340000} suffix="+" duration={2.5} label="Confirmed Strikes" detail="Recorded in the FAA database since 1990" index={1} />
        <div style={{ width: '1px', background: 'var(--border-default)', alignSelf: 'stretch', margin: '20px 0' }} />
        <AnimatedCounter end={292} label="Human Deaths" detail="Fatalities from wildlife strikes since 1988" index={2} />
      </div>

      {/* Hudson Callout */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginTop: 'clamp(48px, 6vw, 80px)',
          display: 'grid',
          gridTemplateColumns: 'clamp(60px, 8vw, 100px) 1fr',
          gap: 'clamp(16px, 3vw, 32px)',
          padding: 'clamp(24px, 4vw, 40px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="mono" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'var(--risk-high)', lineHeight: 1 }}>
            2009
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            JAN 15
          </span>
        </div>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            "Miracle on the Hudson"
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            US Airways Flight 1549 struck a flock of Canada Geese at 2,900 feet, losing both engines.
            Captain Sullenberger landed on the Hudson River — all 155 passengers survived.
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginTop: '12px' }}>
            The current prevention method at most airports?{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              A person with binoculars and a gas cannon.
            </strong>
          </p>
        </div>
      </motion.div>

      {/* Reactive vs Predictive */}
      <div style={{
        marginTop: 'clamp(32px, 4vw, 48px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {[
          { label: 'Current Approach', title: 'Reactive', desc: 'Bird radar systems like MERLIN cost $400K–$800K. They detect birds only after they appear, and don\'t integrate with live flight data.', isHighlight: false },
          { label: 'RAPTOR', title: 'Predictive', desc: 'Fuses live ADS-B, METAR weather, and 340K+ historical records with a trained XGBoost model to predict risk before the aircraft enters the danger zone.', isHighlight: true },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: 'clamp(20px, 3vw, 32px)',
              background: 'var(--bg-card)',
              border: `1px solid ${item.isHighlight ? 'var(--nav-active)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: item.isHighlight ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: item.isHighlight ? 'var(--nav-active)' : 'var(--text-muted)',
            }}>
              {item.label}
            </span>
            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '1.3rem',
              fontWeight: 400,
              color: 'var(--text-primary)',
              marginTop: '8px',
            }}>
              {item.title}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.7 }}>
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
