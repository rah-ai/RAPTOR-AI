/* ─── Risk color and level utilities ─── */

import type { RiskLevel } from '../types/raptor';

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#0F4C29',
  MODERATE: '#7C4A00',
  HIGH: '#C41230',
  EXTREME: '#7B0D1E',
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  LOW: 'var(--risk-low-bg)',
  MODERATE: 'var(--risk-moderate-bg)',
  HIGH: 'var(--risk-high-bg)',
  EXTREME: 'var(--risk-extreme-bg)',
};

export function getRiskColor(level: RiskLevel): string {
  return RISK_COLORS[level] || RISK_COLORS.LOW;
}

export function getRiskBgColor(level: RiskLevel): string {
  return RISK_BG_COLORS[level] || RISK_BG_COLORS.LOW;
}

export function getRiskClass(level: RiskLevel): string {
  return `risk-${level.toLowerCase()}`;
}

export function getRiskBadgeClass(level: RiskLevel): string {
  return `risk-badge risk-badge-${level.toLowerCase()}`;
}

export function scoreToPercent(score: number): number {
  return Math.round(score * 100);
}

export function formatPhase(phase: string): string {
  const map: Record<string, string> = {
    ground: 'On Ground',
    takeoff: 'Takeoff',
    climb: 'Climbing',
    en_route: 'En Route',
    descent: 'Descending',
    approach: 'Approach',
    landing: 'Landing',
  };
  return map[phase] || phase;
}

export function formatAltitude(ft: number): string {
  if (ft <= 0) return 'GND';
  return `${Math.round(ft).toLocaleString()} ft`;
}

export function formatSpeed(kts: number): string {
  return `${Math.round(kts)} kts`;
}

export function formatCallsign(callsign: string): string {
  return callsign.trim() || 'Unknown';
}
