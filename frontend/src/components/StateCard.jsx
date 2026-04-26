export default function StatCard({ label, value, sub, accent = '#00ff9d' }) {
  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid #1e2a38`,
      borderTop: `3px solid ${accent}`,
      borderRadius: '4px',
      padding: '20px 24px',
      minWidth: '160px',
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 700, color: accent }}>
        {value}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8b949e', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#484f58', marginTop: '6px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}