import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RSSIChart({ device }) {
  if (!device || !device.rssiHistory?.length) {
    return <div style={{ color: '#484f58', fontFamily: "'DM Sans'", padding: '20px', textAlign: 'center' }}>Select a device to view RSSI history</div>;
  }

  const data = device.rssiHistory.map((r, i) => ({
    name: i,
    rssi: r.rssi,
    time: new Date(r.ts).toLocaleTimeString(),
  }));

  return (
    <div>
      <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', color: '#8b949e', marginBottom: '12px' }}>
        {device.mac} — RSSI over last {data.length} readings
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a38" />
          <XAxis dataKey="time" tick={{ fill: '#484f58', fontSize: 10, fontFamily: 'Space Mono' }} />
          <YAxis domain={[-100, -20]} tick={{ fill: '#484f58', fontSize: 10, fontFamily: 'Space Mono' }} />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #1e2a38', borderRadius: '4px', fontFamily: 'DM Sans' }}
            labelStyle={{ color: '#8b949e' }}
            itemStyle={{ color: '#00ff9d' }}
          />
          <ReferenceLine y={-70} stroke="#faad14" strokeDasharray="4 4" label={{ value: 'Weak', fill: '#faad14', fontSize: 10 }} />
          <Line type="monotone" dataKey="rssi" stroke="#00ff9d" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00ff9d' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}