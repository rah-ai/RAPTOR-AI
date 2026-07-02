import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWebSocketUrl } from '../../api/raptor';
import { playSiren } from '../../utils/siren';

export default function GlobalAlertBanner() {
  const [globalAlert, setGlobalAlert] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const connect = () => {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'global_alert') {
            setGlobalAlert(data.data);
            playSiren();
            
            // Auto dismiss after 10 seconds
            setTimeout(() => {
              setGlobalAlert(null);
            }, 10000);
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    connect();

    // Listen for local demo alerts
    const handleDemoAlert = (event: any) => {
      setGlobalAlert(event.detail);
      playSiren();
      setTimeout(() => setGlobalAlert(null), 12000);
    };
    window.addEventListener('demo_alert', handleDemoAlert);

    return () => {
      if (wsRef.current) wsRef.current.close();
      window.removeEventListener('demo_alert', handleDemoAlert);
    };
  }, []);

  return (
    <AnimatePresence>
      {globalAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '90vw',
            width: '600px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ fontSize: '32px' }}>🚨</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              GLOBAL EMERGENCY OVERRIDE
            </h3>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              {globalAlert.message}
            </p>
            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.8rem', fontFamily: 'monospace' }}>
              AIRCRAFT: {globalAlert.aircraft_callsign} • RISK SCORE: {(globalAlert.risk_score * 100).toFixed(1)}%
            </p>
          </div>
          <button 
            onClick={() => setGlobalAlert(null)}
            style={{ 
              marginLeft: 'auto', 
              background: 'rgba(0,0,0,0.2)', 
              border: 'none', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
