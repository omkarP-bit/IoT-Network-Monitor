import { whitelistDevice } from '../api/client';

const FRAME_TYPE = ['Mgmt', 'Ctrl', 'Data', 'Ext'];

function rssiBar(rssi) {
  const pct = Math.max(0, Math.min(100, ((rssi + 100) / 70) * 100));
  const color = rssi > -60 ? '#00ff9d' : rssi > -75 ? '#faad14' : '#ff4d4f';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '60px', height: '6px', background: '#1e2a38', borderRadius: '3px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', color }}>{rssi} dBm</span>
    </div>
  );
}

export default function DeviceTable({ devices, onSelect, selectedMac, onUpdate }) {
  async function handleWhitelist(e, mac) {
    e.stopPropagation();
    await whitelistDevice(mac);
    onUpdate();
  }

  const TH = ({ children }) => (
    <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'DM Sans'", fontSize: '11px',
      color: '#484f58', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid #1e2a38', background: '#010409' }}>
      {children}
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>MAC Address</TH>
            <TH>Node</TH>
            <TH>RSSI</TH>
            <TH>Last Seen</TH>
            <TH>Packets</TH>
            <TH>Status</TH>
            <TH></TH>
          </tr>
        </thead>
        <tbody>
          {devices.map(d => {
            const isActive = Date.now() - new Date(d.lastSeen).getTime() < 60_000;
            const isSelected = d.mac === selectedMac;
            const latestRssi = d.rssiHistory?.at(-1)?.rssi ?? '—';

            return (
              <tr
                key={d.mac}
                onClick={() => onSelect(d.mac)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? '#161b22' : 'transparent',
                  borderBottom: '1px solid #1e2a38',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#0d1117'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '10px 12px', fontFamily: "'Space Mono'", fontSize: '12px', color: '#58a6ff' }}>
                  {d.mac}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'DM Sans'", fontSize: '13px', color: '#8b949e' }}>
                  {d.nodeId}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {typeof latestRssi === 'number' ? rssiBar(latestRssi) : '—'}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'DM Sans'", fontSize: '12px', color: '#8b949e' }}>
                  {new Date(d.lastSeen).toLocaleTimeString()}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: "'Space Mono'", fontSize: '12px', color: '#e6edf3' }}>
                  {d.seenCount?.toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontFamily: "'DM Sans'", fontSize: '11px', fontWeight: 600,
                    color: isActive ? '#00ff9d' : '#484f58',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%',
                      background: isActive ? '#00ff9d' : '#484f58',
                      boxShadow: isActive ? '0 0 6px #00ff9d' : 'none' }} />
                    {isActive ? 'Active' : 'Idle'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {!d.isKnown && (
                    <button
                      onClick={(e) => handleWhitelist(e, d.mac)}
                      style={{
                        background: 'transparent', border: '1px solid #30363d',
                        color: '#8b949e', borderRadius: '4px', padding: '3px 10px',
                        cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: '11px',
                      }}
                    >
                      Trust
                    </button>
                  )}
                  {d.isKnown && (
                    <span style={{ fontFamily: "'DM Sans'", fontSize: '11px', color: '#388bfd' }}>✓ Trusted</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!devices.length && (
        <div style={{ color: '#484f58', fontFamily: "'DM Sans'", padding: '30px', textAlign: 'center' }}>
          No devices detected yet
        </div>
      )}
    </div>
  );
}