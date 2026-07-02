/* ─── RAPTOR TypeScript Interfaces ─── */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type FlightPhase = 'ground' | 'takeoff' | 'climb' | 'en_route' | 'descent' | 'approach' | 'landing';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Airport {
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  type: string;
}

export interface CloudLayer {
  cover: string;
  base_ft: number | null;
}

export interface WeatherData {
  icao: string;
  raw_metar: string;
  observation_time: string | null;
  wind_direction: number | null;
  wind_speed: number | null;
  wind_gust: number | null;
  visibility_miles: number | null;
  temperature_c: number | null;
  dewpoint_c: number | null;
  altimeter: number | null;
  clouds: CloudLayer[];
  ceiling_ft: number | null;
  precipitation: boolean;
  flight_category: string;
  cached: boolean;
  cached_at: string | null;
}

export interface Aircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  latitude: number;
  longitude: number;
  altitude_ft: number;
  geo_altitude_ft: number | null;
  velocity_kts: number;
  heading: number;
  vertical_rate_fpm: number;
  on_ground: boolean;
  squawk: string | null;
  phase: FlightPhase;
  last_updated: string | null;
}

export interface RiskFactor {
  name: string;
  contribution: number;
  description: string;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  rule_based_score: number;
  ml_score: number;
  factors: RiskFactor[];
  primary_factor: string;
  recommended_actions?: string[];
}

export interface AircraftRisk {
  aircraft: Aircraft;
  risk: RiskScore;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  risk_level: RiskLevel | null;
  aircraft_callsign: string | null;
}

export interface HistoricalStrike {
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  time_of_day: string | null;
  species: string;
  altitude_ft: number | null;
  phase_of_flight: string;
  damage: string;
  cost: number | null;
  airport_icao: string;
}

export interface ForecastEntry {
  timestamp: string;
  risk_score: number;
  risk_level: RiskLevel;
  is_dawn: boolean;
  is_dusk: boolean;
  label: string;
  factors?: RiskFactor[];
}

export interface Runway {
  airport_icao: string;
  runway_id: string;
  length_ft: number;
  width_ft: number;
  bearing: number;
  le_latitude: number | null;
  le_longitude: number | null;
  he_latitude: number | null;
  he_longitude: number | null;
}

export interface ApproachCorridor {
  runway_id: string;
  bearing: number;
  polygon: number[][];
  risk_level: RiskLevel;
}

export interface DashboardState {
  airport: Airport | null;
  weather: WeatherData | null;
  aircraft: AircraftRisk[];
  overall_risk: RiskScore;
  forecast: ForecastEntry[];
  alerts: Alert[];
  historical_strikes: HistoricalStrike[];
  runways: Runway[];
  approach_corridors: ApproachCorridor[];
  aircraft_count: number;
  last_updated: string | null;
  opensky_cached: boolean;
  opensky_cache_time: string | null;
  historical_data_available: boolean;
}

export interface LiveStateResponse {
  airport: Airport | null;
  weather: WeatherData | null;
  aircraft: AircraftRisk[];
  overall_risk: RiskScore;
  forecast: ForecastEntry[];
  aircraft_count: number;
  last_updated: string | null;
  opensky_cached: boolean;
}

export interface AirportSearchResult {
  airports: Airport[];
  count: number;
}

export interface WebSocketMessage {
  type: 'state_update' | 'pong';
  data?: LiveStateResponse;
  alert?: Alert;
}
