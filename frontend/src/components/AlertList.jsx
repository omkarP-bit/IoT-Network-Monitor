import { resolveAlert } from '../api/client';

export default function AlertList({ alerts, onResolve }) {
  if (!alerts.length) {
    return <div style={{ color: '#8b949e', fontFamily: "'DM Sans'", fontSize: '13px' }}>No active alerts detected.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {alerts.map(alert => (
        <div key={alert._id} style={{
          background: '#020617',
          border: '1px solid #1e2a38',
          borderRadius: '10px',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
            <div>
              <div style={{ color: '#e6edf3', fontWeight: 700, marginBottom: '4px' }}>{alert.message}</div>
              <div style={{ color: '#8b949e', fontSize: '12px' }}>Type: {alert.type} · Severity: {alert.severity}</div>
            </div>
            {!alert.resolved && (
              <button
                onClick={async () => {
                  await resolveAlert(alert._id);
                  onResolve();
                }}
                style={{
                  border: '1px solid #30363d',
                  background: 'transparent',
                  color: '#8b949e',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans'",
                  fontSize: '11px',
                }}
              >
                Resolve
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6e7681' }}>
            <span>MAC: {alert.mac || 'n/a'}</span>
            <span>Node: {alert.nodeId || 'unknown'}</span>
            <span>{new Date(alert.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
