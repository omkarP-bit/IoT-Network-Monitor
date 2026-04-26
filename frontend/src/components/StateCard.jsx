export default function StateCard({ label, value, sub, accent }) {
  return (
    <div style={{
      flex: '1 1 220px',
      background: '#0d1117',
      border: '1px solid #1e2a38',
      borderRadius: '14px',
      padding: '22px 26px',
      minWidth: '200px',
    }}>
      <div style={{ color: accent, fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '36px', fontWeight: 700, color: '#e6edf3', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ color: '#8b949e', fontSize: '12px' }}>{sub}</div>
    </div>
  );
}
