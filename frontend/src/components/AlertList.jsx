import { resolveAlert } from '../api/client';

const SEVERITY_COLOR = { high: '#ff4d4f', medium: '#faad14', low: '#52c41a' };
const TYPE_LABEL = {
  rogue_device:   '🚨 Rogue Device',
  traffic_spike:  '📈 Traffic Spike',
  signal_anomaly: '📡 Signal Anomaly',
};

export default function AlertList({ alerts, onResolve }) {
  if (!alerts.length) return (
    <div style={{ color: '#484f58', fontFamily: "'DM Sans'", padding: '20px 0', textAlign: 'center' }}>
      No active alerts
    </div>
  );

  async function handleResolve(id) {
    await resolveAlert(id);
    onResolve();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {alerts.map(a => (
        <div key={a._id} style={{
          background: '#0d1117',
          border: `1px solid #1e2a38`,
          borderLeft: `4px solid ${SEVERITY_COLOR[a.severity] || '#888'}`,
          borderRadius: '4px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: '#e6edf3', fontSize: '14px' }}>
              {TYPE_LABEL[a.type] || a.type}
            </div>
            <div style={{ fontFamily: "'DM Sans'", color: '#8b949e', fontSize: '12px', marginTop: '2px' }}>
              {a.message}
            </div>
            <div style={{ fontFamily: "'Space Mono'", color: '#484f58', fontSize: '10px', marginTop: '4px' }}>
              {new Date(a.createdAt).toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={() => handleResolve(a._id)}
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              color: '#8b949e',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: "'DM Sans'",
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}