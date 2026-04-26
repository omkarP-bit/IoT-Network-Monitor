import { useState, useEffect, useCallback } from 'react';
import { getDevices, getAlerts, getDevice } from '../api/client';
import StatCard from '../components/StateCard';
import DeviceTable from '../components/DeviceTable';
import AlertList from '../components/AlertList';
import RSSIChart from '../components/RSSIChart';

const POLL_MS = 5000;

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedMac, setSelectedMac] = useState(null);
  const [selectedDev, setSelectedDev] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeOnly, setActiveOnly] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [devs, alts] = await Promise.all([getDevices(activeOnly), getAlerts()]);
      setDevices(devs);
      setAlerts(alts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (!selectedMac) {
      setSelectedDev(null);
      return;
    }

    getDevice(selectedMac)
      .then(setSelectedDev)
      .catch(() => setSelectedDev(null));
  }, [selectedMac]);

  const activeCount = devices.filter(d => Date.now() - new Date(d.lastSeen).getTime() < 60_000).length;
  const rogueCount = devices.filter(d => !d.isKnown).length;
  const alertCount = alerts.length;

  return (
    <div style={{ minHeight: '100vh', background: '#010409', color: '#e6edf3' }}>
      <header style={{
        borderBottom: '1px solid #1e2a38',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0d1117',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#00ff9d', boxShadow: '0 0 8px #00ff9d',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: "'Space Mono'", fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em', color: '#e6edf3' }}>
            NET<span style={{ color: '#00ff9d' }}>MONITOR</span>
          </span>
          <span style={{ fontFamily: "'DM Sans'", fontSize: '12px', color: '#484f58', marginLeft: '8px' }}>
            IoT Network Anomaly Detection
          </span>
        </div>
        <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', color: '#484f58' }}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
        </div>
      </header>

      <main style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <StatCard label="Total Devices" value={devices.length} sub="all time" accent="#00ff9d" />
          <StatCard label="Active Now" value={activeCount} sub="seen < 60s ago" accent="#58a6ff" />
          <StatCard label="Untrusted" value={rogueCount} sub="not whitelisted" accent="#faad14" />
          <StatCard label="Open Alerts" value={alertCount} sub="unresolved anomalies" accent="#ff4d4f" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section style={{ background: '#0d1117', border: '1px solid #1e2a38', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid #1e2a38',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: '#e6edf3', fontSize: '14px' }}>
                  Detected Devices
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans'", fontSize: '12px', color: '#8b949e', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={e => setActiveOnly(e.target.checked)}
                    style={{ accentColor: '#00ff9d' }}
                  />
                  Active only
                </label>
              </div>
              <DeviceTable
                devices={devices}
                onSelect={setSelectedMac}
                selectedMac={selectedMac}
                onUpdate={fetchAll}
              />
            </section>

            <section style={{ background: '#0d1117', border: '1px solid #1e2a38', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: '#e6edf3', fontSize: '14px', marginBottom: '14px' }}>
                Signal Strength History
              </div>
              <RSSIChart device={selectedDev} />
            </section>
          </div>

          <section style={{ background: '#0d1117', border: '1px solid #1e2a38', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2a38', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, color: '#e6edf3', fontSize: '14px' }}>
                Alerts
              </span>
              {alertCount > 0 && (
                <span style={{
                  background: '#ff4d4f22', color: '#ff4d4f',
                  borderRadius: '12px', padding: '2px 8px',
                  fontFamily: "'Space Mono'", fontSize: '11px', fontWeight: 700,
                }}>
                  {alertCount}
                </span>
              )}
            </div>
            <div style={{ padding: '12px' }}>
              <AlertList alerts={alerts} onResolve={fetchAll} />
            </div>
          </section>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
