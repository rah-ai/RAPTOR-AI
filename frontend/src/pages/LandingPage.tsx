/* ─── RAPTOR Landing Page ─── */

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorks from '../components/landing/HowItWorks';
import CTASection from '../components/landing/CTASection';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function LandingPage({ theme, toggleTheme }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAirportSelect = (icao: string) => {
    navigate(`/dashboard/${icao}`);
  };

  return (
    <div ref={containerRef} style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <HeroSection onAirportSelect={handleAirportSelect} />
      <ProblemSection />
      <HowItWorks />
      <CTASection onAirportSelect={handleAirportSelect} />
    </div>
  );
}
