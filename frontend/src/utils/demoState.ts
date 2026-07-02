import type { LiveStateResponse, DashboardState } from '../types/raptor';

export const DEMO_AIRPORT_ICAO = 'KLGA';

export const MOCK_DEMO_STATE: LiveStateResponse = {
  timestamp: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  aircraft_count: 1,
  opensky_cached: false,
  overall_risk: {
    score: 0.94,
    level: 'EXTREME',
    rule_based_score: 0.95,
    ml_score: 0.93,
    primary_factor: 'Large Flock Migration Activity in Climb Corridor',
    factors: [
      { name: 'Altitude Band (0-3000ft)', contribution: 0.40, description: 'Critical altitude for bird strikes.' },
      { name: 'Phase of Flight (Climb)', contribution: 0.25, description: 'Engines at max thrust, highest ingestion risk.' },
      { name: 'Proximity to Water/Refuge', contribution: 0.20, description: 'Hudson River and nearby wetlands support large waterfowl flocks.' },
      { name: 'Season (Winter)', contribution: 0.15, description: 'Heavy presence of migratory Canada Geese.' }
    ]
  },
  aircraft: [
    {
      aircraft: {
        icao24: 'awe1549',
        callsign: 'AWE1549',
        origin_country: 'United States',
        latitude: 40.785,
        longitude: -73.875,
        altitude_ft: 2800,
        geo_altitude_ft: 2850,
        velocity_kts: 220,
        heading: 320,
        vertical_rate_fpm: 1200,
        on_ground: false,
        squawk: '1549',
        phase: 'climb',
        last_updated: new Date().toISOString()
      },
      risk: {
        score: 0.98,
        level: 'EXTREME',
        rule_based_score: 0.99,
        ml_score: 0.97,
        primary_factor: 'Intersecting dense flock of Canada Geese at 2800ft',
        factors: [
          { name: 'Altitude (2800 ft)', contribution: 0.4, description: 'Heavy geese presence.' },
          { name: 'Climb Phase', contribution: 0.3, description: 'High thrust.' }
        ]
      }
    }
  ],
  weather: {
    icao: 'KLGA',
    raw_metar: 'METAR KLGA 152051Z 33011KT 10SM BKN035 M06/M14 A3032 RMK AO2 SLP265',
    observation_time: '2009-01-15T20:51:00Z',
    wind_direction: 330,
    wind_speed: 11,
    wind_gust: null,
    visibility_miles: 10,
    temperature_c: -6,
    dewpoint_c: -14,
    altimeter: 30.32,
    clouds: [{ cover: 'BKN', base_ft: 3500 }],
    ceiling_ft: 3500,
    precipitation: false,
    flight_category: 'VFR',
    cached: false,
    cached_at: null
  },
  forecast: [
    { timestamp: new Date(Date.now() + 1000 * 60 * 60).toISOString(), risk_score: 0.92, risk_level: 'EXTREME', is_dawn: false, is_dusk: false, label: '1 Hr' },
    { timestamp: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), risk_score: 0.88, risk_level: 'HIGH', is_dawn: false, is_dusk: true, label: '2 Hr' },
    { timestamp: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), risk_score: 0.75, risk_level: 'HIGH', is_dawn: false, is_dusk: true, label: '3 Hr' },
  ]
};
