import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function RSSIChart({ device }) {
  if (!device?.rssiHistory?.length) {
    return <div style={{ color: '#8b949e', fontFamily: "'DM Sans'", fontSize: '13px' }}>Select a device to see RSSI history.</div>;
  }

  const data = device.rssiHistory.map(reading => ({
    ts: new Date(reading.ts).toLocaleTimeString(),
    rssi: reading.rssi,
  }));

  return (
    <div style={{ minHeight: '320px' }}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#161b22" strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={{ stroke: '#1e2a38' }} tickLine={false} />
          <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={{ stroke: '#1e2a38' }} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip contentStyle={{ background: '#0d1117', borderColor: '#1e2a38', color: '#e6edf3' }} />
          <Line type="monotone" dataKey="rssi" stroke="#00ff9d" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
