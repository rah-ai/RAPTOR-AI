/* ─── RAPTOR Weather Panel v2 — Clean, compact, data-rich ─── */

import type { WeatherData } from '../../types/raptor';

interface Props {
  weather: WeatherData | null;
}

function WeatherIcon({ weather }: { weather: WeatherData }) {
  const raw = (weather.raw_metar || '').toLowerCase();
  const cat = weather.flight_category || '';
  if (raw.includes('ts') || raw.includes('thunder')) return '⛈';
  if (raw.includes('ra') || raw.includes('dz')) return '🌧';
  if (raw.includes('sn')) return '❄';
  if (raw.includes('fg') || raw.includes('br') || raw.includes('hz')) return '🌫';
  if (raw.includes('ovc')) return '☁';
  if (raw.includes('bkn') || raw.includes('sct') || raw.includes('few')) return '⛅';
  return '☀';
}

function getSkyCondition(weather: WeatherData): string {
  if (weather.clouds && weather.clouds.length > 0) {
    const highest = weather.clouds[weather.clouds.length - 1];
    const cover = (highest.cover || '').toUpperCase();
    switch (cover) {
      case 'OVC': return 'Overcast';
      case 'BKN': return 'Broken';
      case 'SCT': return 'Scattered';
      case 'FEW': return 'Few Clouds';
      case 'CLR': case 'SKC': return 'Clear';
      default: return cover || 'Clear';
    }
  }
  return 'Clear';
}

export default function WeatherPanel({ weather }: Props) {
  if (!weather) {
    return (
      <div className="card">
        <div className="card-header"><h4>Weather</h4></div>
        <div className="card-body" style={{ padding: '24px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: '70%', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const skyCondition = getSkyCondition(weather);

  const items = [
    { label: 'Wind', value: `${weather.wind_speed ?? 0} kts`, sub: weather.wind_direction ? `${weather.wind_direction}°` : undefined },
    { label: 'Visibility', value: `${weather.visibility_miles ?? '10+'} mi` },
    { label: 'Temp', value: `${weather.temperature_c ?? '--'}°C` },
    { label: 'Dewpoint', value: `${weather.dewpoint_c ?? '--'}°C` },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h4>Weather · METAR</h4>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          {weather.icao || '—'}
        </span>
      </div>

      <div className="card-body" style={{ padding: '14px 18px' }}>
        {/* Main condition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.8rem' }}>
            <WeatherIcon weather={weather} />
          </span>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {skyCondition}
            </div>
            {weather.precipitation && (
              <div style={{ fontSize: '0.7rem', color: 'var(--risk-moderate)', marginTop: 2 }}>
                Precipitation detected
              </div>
            )}
            {weather.flight_category && (
              <div className="mono" style={{
                fontSize: '0.6rem',
                color: weather.flight_category === 'VFR' ? 'var(--risk-low)' :
                       weather.flight_category === 'MVFR' ? 'var(--risk-moderate)' :
                       'var(--risk-high)',
                marginTop: 2,
              }}>
                {weather.flight_category}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}>
          {items.map(item => (
            <div key={item.label} style={{
              padding: '8px 10px',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {item.label}
              </div>
              <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                {item.value}
                {item.sub && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>{item.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Raw METAR */}
        {weather.raw_metar && (
          <div style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            wordBreak: 'break-all',
            maxHeight: '44px',
            overflow: 'hidden',
          }}>
            {weather.raw_metar}
          </div>
        )}
      </div>
    </div>
  );
}
