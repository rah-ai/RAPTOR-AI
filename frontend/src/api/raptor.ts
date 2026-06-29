/* ─── RAPTOR API Client ─── */

import type {
  AirportSearchResult,
  DashboardState,
  LiveStateResponse,
  HistoricalStrike,
  ForecastEntry,
  Alert,
} from '../types/raptor';

const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  searchAirports: (query: string) =>
    fetchJSON<AirportSearchResult>(`/api/airports/search?q=${encodeURIComponent(query)}`),

  selectAirport: (icao: string) =>
    fetchJSON<DashboardState>('/api/airports/select', {
      method: 'POST',
      body: JSON.stringify({ icao }),
    }),

  getLiveState: () =>
    fetchJSON<LiveStateResponse>('/api/live/state'),

  getHistoricalStrikes: () =>
    fetchJSON<HistoricalStrike[]>('/api/historical/strikes'),

  getForecast: () =>
    fetchJSON<ForecastEntry[]>('/api/forecast'),

  getAlerts: () =>
    fetchJSON<Alert[]>('/api/alerts'),

  getHealth: () =>
    fetchJSON<{ status: string; model_loaded: boolean }>('/api/health'),
};

export function getWebSocketUrl(): string {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.PROD ? window.location.host : (import.meta.env.VITE_WS_HOST || 'localhost:8000');
  return `${wsProtocol}//${host}/ws/live`;
}
