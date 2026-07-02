import { motion } from 'framer-motion';
import type { RiskScore } from '../../types/raptor';

interface Props {
  overallRisk: RiskScore;
}

export default function DefensePanel({ overallRisk }: Props) {
  const actions = overallRisk.recommended_actions || [];
  const firingCannons = actions.includes('TRIGGER_ACOUSTIC_CANNONS');
  const armedCannons = actions.includes('ARM_ACOUSTIC_CANNONS');
  const broadcasting = actions.includes('ATC_DATALINK_ALERT');

  return (
    <div className="card" style={{ marginTop: '16px' }}>
      <div className="card-header">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          DEFENSE SYSTEMS
          {firingCannons && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-error)',
                boxShadow: '0 0 8px var(--accent-error)'
              }}
            />
          )}
        </h4>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>INTEGRATIONS</div>
      </div>
      
      <div className="card-body" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Acoustic Cannons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Acoustic Cannons</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Runway IoT Integration</div>
            </div>
            {firingCannons ? (
              <motion.div 
                animate={{ backgroundColor: ['rgba(201,48,62,0.1)', 'rgba(201,48,62,0.3)', 'rgba(201,48,62,0.1)'] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--accent-error)', color: 'var(--accent-error)', fontSize: '0.7rem', fontWeight: 700 }}
              >
                FIRING
              </motion.div>
            ) : armedCannons ? (
              <div style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--risk-moderate-bg)', color: 'var(--risk-moderate)', fontSize: '0.7rem', fontWeight: 700 }}>
                ARMED
              </div>
            ) : (
              <div style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>
                STANDBY
              </div>
            )}
          </div>

          {/* BirdCast Radar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>NEXRAD BirdCast</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Live Avian Radar</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontSize: '0.7rem', fontWeight: 700 }}>
              CONNECTED
            </div>
          </div>

          {/* ATC Datalink */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>ATC Datalink</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ACARS Warning System</div>
            </div>
            {broadcasting ? (
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--accent-error)', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}
              >
                BROADCASTING
              </motion.div>
            ) : (
              <div style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontSize: '0.7rem', fontWeight: 700 }}>
                ACTIVE
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: '4px 0' }} />

          {/* Financial Impact */}
          <div style={{ padding: '8px 12px', background: 'rgba(52, 211, 153, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projected Engine Damages Prevented
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              $14,500,000+
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '4px' }}>
                YTD
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
