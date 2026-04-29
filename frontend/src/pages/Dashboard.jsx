import { useState, useEffect, useCallback, useRef } from 'react';
import { getDevices, getAlerts, getDevice } from '../api/client';
import DeviceTable from '../components/DeviceTable';
import AlertList   from '../components/AlertList';
import RSSIChart   from '../components/RSSIChart';

const POLL_MS = 5000;

const ASCII_CAT = [
  '  /\\_/\\  ',
  ' ( o.o ) ',
  '  > ^ <  ',
  ' /|   |\\ ',
];

const ASCII_LOGO = [
  '  ███╗   ██╗███████╗████████╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗',
  '  ████╗  ██║██╔════╝╚══██╔══╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║',
  '  ██╔██╗ ██║█████╗     ██║   ██║ █╗ ██║███████║   ██║   ██║     ███████║',
  '  ██║╚██╗██║██╔══╝     ██║   ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║',
  '  ██║ ╚████║███████╗   ██║   ╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║',
  '  ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝',
];

const NMR_BANNER = [
'  ███╗   ██╗ ███╗   ███╗ ██████╗ ',
'  ████╗  ██║ ████╗ ████║ ██╔══██╗',
'  ██╔██╗ ██║ ██╔████╔██║ ██████╔╝',
'  ██║╚██╗██║ ██║╚██╔╝██║ ██╔══██╗',
'  ██║ ╚████║ ██║ ╚═╝ ██║ ██║  ██║',
'  ╚═╝  ╚═══╝ ╚═╝     ╚═╝ ╚═╝  ╚═╝'
];

const ASCII_DIVIDER_TOP    = '  ╔' + '═'.repeat(68) + '╗';
const ASCII_DIVIDER_BOTTOM = '  ╚' + '═'.repeat(68) + '╝';
const ASCII_SIDE           = (text = '') => `  ║  ${text.padEnd(66)}║`;

const BOOT_LINES = [
  { text: 'SeaBIOS (version 1.16.3-arch)',                        delay: 0,    color: '#f2b93f' },
  { text: '',                                                      delay: 200  },
  { text: ':: loading early microcode...',                        delay: 400,  ok: true },
  { text: ':: initializing kernel ring buffer...',                delay: 600,  ok: true },
  { text: ':: mounting virtual filesystems...',                   delay: 800,  ok: true },
  { text: ':: starting udev event manager...',                    delay: 1000, ok: true },
  { text: ':: bringing up network interfaces...',                 delay: 1400, ok: true },
  { text: ':: loading netmonitor kernel module...',               delay: 1800, ok: true },
  { text: ':: scanning 2.4GHz / 5GHz bands...',                  delay: 2200, ok: true },
  { text: ':: netmonitor daemon registered on :7331',             delay: 2600, ok: true },
  { text: '',                                                      delay: 2800 },
  { text: 'Arch Linux 6.9.3-arch1-1 (tty1)',                     delay: 3000, color: '#e8a320' },
  { text: '',                                                      delay: 3100 },
  { text: 'netwatch login: root',                                 delay: 3300, color: '#7ab0c0' },
  { text: 'Last login: Thu Apr 24 03:12:44 on tty1',             delay: 3600, color: '#8d7750' },
  { text: '',                                                      delay: 3800 },
  { text:'', delay:3800 },
  ...NMR_BANNER.map((line,i)=>({
  text: line,
  delay:3900 + i*70,
  color:'#e8a320'
})),

{ text:'', delay:4380 },

{ text:'       NMR :: NetMonitor', delay:4460, color:'#7ab0c0' },
{ text:'    wireless traffic sentinel', delay:4540, color:'#9f8650' },

{ text:'', delay:4620 },
  
  
];

const FUN_ERRORS = {
  'help':    "available commands: netmonitor activate",
  'ls':      "drwxr-xr-x  netmonitor/  passwd  shadow  (hint: try netmonitor activate)",
  'sudo':    "root is already the current user, nice try though",
  'vim':     "vim: no escape. type :q! ... just kidding. try netmonitor activate",
  'neofetch':"neofetch: not installed. btw you're already on arch, we know",
  'clear':   "__CLEAR__",
  'pwd':     "/home/root/netwatch",
  'whoami':  "root",
  'uname':   "Linux netwatch 6.9.3-arch1-1 x86_64 GNU/Linux",
  'htop':    "htop: 1 process found — netmonitor (sleeping). wake it: netmonitor activate",
  'cat':     "__CAT__",
  'meow':    "__CAT__",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0f0f0f; }
  ::-webkit-scrollbar-thumb { background: #6f5c28; }

  @keyframes blink    { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes flicker  { 0%,100%{opacity:1} 93%{opacity:1} 94%{opacity:.85} 96%{opacity:1} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes shrink   {
    from { height: 100vh; }
    to   { height: 52px;  }
  }
  @keyframes dashIn   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes catBlink { 0%,89%{opacity:1} 90%,95%{opacity:0} 96%,100%{opacity:1} }

  .boot-line  { animation: fadeIn .18s ease both; }
  .terminal   { animation: flicker 9s infinite; }
  .dash-enter { animation: dashIn .4s ease both; }
  .cat-eyes   { animation: catBlink 4s infinite; }

  .term-input {
    background: transparent;
    border: none;
    outline: none;
    color: #e8a320;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    caret-color: transparent;
    width: 100%;
  }
`;

function BootLine({ line }) {
  if (line.ok) return (
    <div className="boot-line" style={{ display: 'flex', justifyContent: 'space-between', color: '#b29652', fontSize: '13px', lineHeight: '1.15' }}>
      <span>{line.text}</span>
      <span style={{ color: '#e8a320', marginLeft: '24px' }}>[ OK ]</span>
    </div>
  );
  return (
    <div className="boot-line" style={{ color: line.color || '#8d7750', fontSize: '13px', lineHeight: '1.7' }}>
      {line.text || '\u00a0'}
    </div>
  );
}

function Prompt({ children, showCursor = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', lineHeight: '1.7' }}>
      <span style={{ color: '#e8a320', userSelect: 'none' }}>root</span>
      <span style={{ color: '#8d7750', userSelect: 'none' }}>@</span>
      <span style={{ color: '#7ab0c0', userSelect: 'none' }}>netwatch</span>
      <span style={{ color: '#8d7750', userSelect: 'none' }}>~</span>
      <span style={{ color: '#b29652', userSelect: 'none' }}>$</span>
      <span style={{ color: '#e8a320', flex: 1 }}>
        {children}
        {showCursor && <span style={{ animation: 'blink 1s infinite', color: '#e8a320' }}>█</span>}
      </span>
    </div>
  );
}

function AsciiCat() {
  return (
    <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#c8a870', paddingLeft: '4px' }}>
      <div style={{ color: '#b29652' }}>  // process found: /usr/bin/cat — executing...</div>
      <div style={{ marginTop: '4px' }}>
        {/* cat body */}
        <div>{'  /\\_____/\\'}</div>
        <div>
          {'  ( '}
          <span className="cat-eyes">{'o'}</span>
          {' . '}
          <span className="cat-eyes">{'o'}</span>
          {' )'}</div>
        <div>{'  (  =^=  )'}</div>
        <div>{'   )     ('}</div>
        <div>{'  (_)-(_)--'}</div>
      </div>
      <div style={{ color: '#b29652', marginTop: '4px' }}>{'  // meow. try: netmonitor activate'}</div>
    </div>
  );
}

function AsciiLogo() {
  return (
    <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#6f5c28', marginBottom: '8px', overflow: 'hidden' }}>
      {ASCII_LOGO.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
}

// ── ASCII helpers ──────────────────────────────────────────────

function asciiTable(devices) {
  if (!devices.length) return ['  no devices found.'];
  const cols = ['MAC', 'VENDOR', 'RSSI', 'LAST SEEN', 'STATUS'];
  const rows = devices.map(d => {
    const age = Math.floor((Date.now() - new Date(d.lastSeen).getTime()) / 1000);
    const status = age < 60 ? 'ACTIVE' : 'IDLE';
    return [d.mac, (d.vendor || 'Unknown').slice(0, 18), `${d.rssi ?? '--'} dBm`, `${age}s ago`, status];
  });
  const widths = cols.map((c, i) => Math.max(c.length, ...rows.map(r => (r[i] || '').length)) + 2);
  const sep = '  ┼' + widths.map(w => '─'.repeat(w)).join('┼') + '┼';
  const header = '  │' + cols.map((c, i) => ` ${c.padEnd(widths[i] - 1)}`).join('│') + '│';
  const topBar = '  ┌' + widths.map(w => '─'.repeat(w)).join('┬') + '┐';
  const botBar = '  └' + widths.map(w => '─'.repeat(w)).join('┴') + '┘';
  const dataRows = rows.map(r =>
    '  │' + r.map((c, i) => ` ${c.padEnd(widths[i] - 1)}`).join('│') + '│'
  );
  return [topBar, header, sep, ...dataRows, botBar];
}

function asciiAlerts(alerts) {
  if (!alerts.length) return ['  >> no active alerts. system nominal.'];
  return alerts.map((a, i) =>
    `  [${String(i + 1).padStart(2, '0')}] ${a.severity?.toUpperCase().padEnd(6) || 'WARN  '} ${a.message || JSON.stringify(a)}`
  );
}

function asciiSparkline(device) {
  if (!device?.rssiHistory?.length) return ['  >> no signal history for selected device.'];
  const bars = '▁▂▃▄▅▆▇█';
  const vals = device.rssiHistory.slice(-40);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const line = vals.map(v => bars[Math.round(((v - min) / range) * 7)]).join('');
  return [
    `  RSSI :: ${device.mac}`,
    `  min ${min} dBm ${'─'.repeat(20)} max ${max} dBm`,
    `  ${line}`,
  ];
}

// ── Dashboard terminal output ──────────────────────────────────

function DashOutput({ devices, alerts, selectedDev, selectedMac, onSelect, activeOnly, setActiveOnly, onUpdate, onResolve }) {
  const activeCount = devices.filter(d => Date.now() - new Date(d.lastSeen).getTime() < 60_000).length;

  const catLines = [
    '     /\\_____/\\',
    '    ( ` . \' )',
    '    (  =^=  )',
    '     )     (',
    '    (_)-(_)--',
  ];

  return (
    <div className="dash-enter" style={{ fontSize: '13px', lineHeight: 1.75 }}>

      {/* ascii logo banner */}
      <div style={{ color: '#2a1a00', marginBottom: '2px' }}>
        {[
          '  ┌─────────────────────────────────────────┐',
          '  │  ███╗   ██╗███╗   ███╗ ██████╗ ███╗  ██╗│',
          '  │  ████╗  ██║████╗ ████║██╔═══██╗████╗ ██║│',
          '  │  ██╔██╗ ██║██╔████╔██║██║   ██║██╔██╗██║│',
          '  │  ██║╚██╗██║██║╚██╔╝██║██║   ██║██║╚████║│',
          '  │  ██║ ╚████║██║ ╚═╝ ██║╚██████╔╝██║ ╚███║│',
          '  │  ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚══╝│',
          '  └─────────────────────────────────────────┘',
        ].map((line, i) => <div key={i} style={{ color: '#e8a320' }}>{line}</div>)}
      </div>

      {/* cat mascot + summary side by side */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '4px' }}>
        <div style={{ color: '#b29652', flexShrink: 0 }}>
          {catLines.map((l, i) => <div key={i}>{l}</div>)}
          <div style={{ color: '#8d7750', fontSize: '11px', marginTop: '2px' }}>{'  ^ monitoring...'}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#b29652' }}>
            {`  >> netmonitor activated`}
          </div>
          <div style={{ color: '#8d7750' }}>
            {`  >> ${devices.length} devices found`}
          </div>
          <div style={{ color: activeCount > 0 ? '#c8a870' : '#8d7750' }}>
            {`  >> ${activeCount} active`}
          </div>
          <div style={{ color: alerts.length > 0 ? '#ff6b6b' : '#8d7750' }}>
            {`  >> ${alerts.length} alert(s)`}
          </div>
        </div>
      </div>

      <div style={{ color: '#6f5c28', marginBottom: '16px' }}>
        {'  ═'.repeat(32)}
      </div>

      {/* devices header */}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╔══╡ DEVICE INVENTORY ╞' + '═'.repeat(30) + '╗'}
      </div>
      {asciiTable(devices).map((line, i) => {
        const tableLines = asciiTable(devices);
        const isDataRow = i > 2 && i < tableLines.length - 1;
        const rowIndex  = i - 3;
        const dev       = devices[rowIndex];
        const isActive  = dev && Date.now() - new Date(dev.lastSeen).getTime() < 60_000;
        const isSelected = dev && dev.mac === selectedMac;
        return (
          <div
            key={i}
            onClick={isDataRow && dev ? () => onSelect(dev.mac) : undefined}
            style={{
              color: isSelected ? '#e8a320' : isDataRow && isActive ? '#c8a870' : '#4a3a10',
              cursor: isDataRow ? 'pointer' : 'default',
              background: isSelected ? '#1a1200' : 'transparent',
              fontFamily: "'IBM Plex Mono', monospace",
              transition: 'background .15s',
            }}
          >
            {line}
          </div>
        );
      })}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╚' + '═'.repeat(52) + '╝'}
      </div>

      <div style={{ color: '#6f5c28', margin: '16px 0 4px' }}>{'  ═'.repeat(32)}</div>

      {/* alerts */}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╔══╡ ALERT LOG ╞' + '═'.repeat(35) + '╗'}
      </div>
      {asciiAlerts(alerts).map((line, i) => (
        <div key={i} style={{ color: alerts[i] ? '#ff4d4f' : '#8d7750' }}>{line}</div>
      ))}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╚' + '═'.repeat(52) + '╝'}
      </div>

      <div style={{ color: '#6f5c28', margin: '16px 0 4px' }}>{'  ═'.repeat(32)}</div>

      {/* rssi */}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╔══╡ SIGNAL STRENGTH ╞' + '═'.repeat(29) + '╗'}
      </div>
      {asciiSparkline(selectedDev).map((line, i) => (
        <div key={i} style={{ color: '#c8a870' }}>{line}</div>
      ))}
      <div style={{ color: '#7ab0c0', marginBottom: '4px' }}>
        {'  ╚' + '═'.repeat(52) + '╝'}
      </div>

      <div style={{ color: '#6f5c28', margin: '16px 0 4px' }}>{'  ═'.repeat(32)}</div>
      <div style={{ color: '#8d7750' }}>
        {'  type "help" for available commands  •  type "cat" or "meow" for friend'}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [devices,      setDevices]      = useState([]);
  const [alerts,       setAlerts]       = useState([]);
  const [selectedMac,  setSelectedMac]  = useState(null);
  const [selectedDev,  setSelectedDev]  = useState(null);
  const [activeOnly,   setActiveOnly]   = useState(false);

  const [bootDone,     setBootDone]     = useState(false);
  const [bootLines,    setBootLines]    = useState([]);
  const [activated,    setActivated]    = useState(false);
  const [collapsed,    setCollapsed]    = useState(false);

  const [history,      setHistory]      = useState([]);
  const [input,        setInput]        = useState('');

  const inputRef   = useRef(null);
  const bottomRef  = useRef(null);
  const termRef    = useRef(null);
  const bootStarted = useRef(false);

  // ── data fetching ──
  const fetchAll = useCallback(async () => {
    const [devs, alts] = await Promise.all([getDevices(activeOnly), getAlerts()]);
    setDevices(devs);
    setAlerts(alts);
  }, [activeOnly]);

  useEffect(() => { if (activated) { fetchAll(); const id = setInterval(fetchAll, POLL_MS); return () => clearInterval(id); } }, [activated, fetchAll]);

  useEffect(() => {
    if (!selectedMac) { setSelectedDev(null); return; }
    getDevice(selectedMac).then(setSelectedDev).catch(() => setSelectedDev(null));
  }, [selectedMac, devices]);

  // ── boot sequence ──
useEffect(() => {
  if (bootStarted.current) return;
  bootStarted.current = true;

  BOOT_LINES.forEach((line, i) => {
    setTimeout(() => {
      setBootLines(prev => [...prev, line]);

      if (i === BOOT_LINES.length - 1) {
        setTimeout(() => setBootDone(true), 300);
      }

    }, line.delay);
  });

}, []);

  // ── auto scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bootLines, history, input, activated]);

  // ── focus input ──
  useEffect(() => {
    if (bootDone) inputRef.current?.focus();
  }, [bootDone]);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();

    if (trimmed === 'netmonitor activate') {
      setHistory(prev => [...prev, { prompt: cmd, output: null, special: 'activate' }]);
      setTimeout(() => { setActivated(true); setTimeout(() => setCollapsed(true), 800); }, 400);
      return;
    }

    if (trimmed === 'clear') {
      setHistory([]);
      setBootLines([]);
      return;
    }

    if (trimmed === 'cat' || trimmed === 'meow') {
      setHistory(prev => [...prev, { prompt: cmd, output: null, special: 'cat' }]);
      return;
    }

    const response = FUN_ERRORS[trimmed]
      || (trimmed === '' ? null : `bash: ${trimmed}: command not found`);

    if (response && response !== '__CAT__') {
      setHistory(prev => [...prev, { prompt: cmd, output: response }]);
    } else if (!response) {
      setHistory(prev => [...prev, { prompt: cmd, output: null }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <>
      <style>{CSS}</style>
      <div
        className="terminal"
        style={{
          minHeight: '100vh',
          background: '#0f0f0f',
          color: '#e8a320',
          fontFamily: "'IBM Plex Mono', monospace",
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={focusInput}
      >
        {/* scanlines */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99,
          background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)',
        }} />

        {/* ── TERMINAL PANE ── */}
        <div
          ref={termRef}
          style={{
            position: collapsed ? 'sticky' : 'relative',
            top: 0,
            zIndex: 50,
            background: '#0f0f0f',
            borderBottom: collapsed ? '1px solid #6f5c28' : 'none',
            height: collapsed ? '52px' : 'auto',
            overflow: 'hidden',
            transition: 'height .4s cubic-bezier(.4,0,.2,1)',
            flexShrink: 0,
          }}
        >
          {collapsed ? (
            /* collapsed top bar */
            <div style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#6f5c28' }}>┌─[</span>
                <span style={{ color: '#e8a320', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>
                  NET<span style={{ color: '#7ab0c0' }}>MONITOR</span>
                </span>
                <span style={{ color: '#6f5c28' }}>]─[</span>
                <span style={{ color: '#b29652', fontSize: '11px' }}>root@netwatch</span>
                <span style={{ color: '#6f5c28' }}>]</span>
                <span style={{ color: '#8d7750', fontSize: '11px' }}>// active</span>
                {/* tiny cat in header */}
                <span style={{ color: '#7ab0c0', fontSize: '11px' }}>{'›(^.^)‹'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px' }}>
                <span style={{ color: '#8d7750' }}>DEV[{String(devices.length).padStart(2,'0')}]</span>
                <span style={{ color: alerts.length > 0 ? '#ff4d4f' : '#8d7750' }}>
                  ALERT[{String(alerts.length).padStart(2,'0')}]
                </span>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#e8a320', boxShadow: '0 0 6px #e8a32088',
                  animation: 'pulse 2s infinite', display: 'inline-block',
                }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setCollapsed(false); }}
                  style={{
                    background: 'transparent', border: '1px solid #6f5c28',
                    color: '#b29652', fontFamily: "'IBM Plex Mono'", fontSize: '10px',
                    padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.1em',
                  }}
                >
                  expand ↑
                </button>
              </div>
            </div>
          ) : (
            /* full terminal */
            <div style={{ overflowX: 'auto',
whiteSpace: 'pre', minHeight: activated ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>

              {/* boot lines */}
              {bootLines.map((line, i) => <BootLine key={i} line={line} />)}

              {/* history */}
              {history.map((entry, i) => (
                <div key={i}>
                  <Prompt>{entry.prompt}</Prompt>
                  {entry.special === 'activate' && (
                    <div style={{ color: '#e8a320', fontSize: '13px', lineHeight: 1.7 }}>
                      <div>  {'>>'} authenticating...</div>
                      <div>  {'>>'} starting packet capture...</div>
                      <div>  {'>>'} netmonitor online.</div>
                    </div>
                  )}
                  {entry.special === 'cat' && <AsciiCat />}
                  {entry.output && entry.output !== '__CLEAR__' && (
                    <div style={{ color: '#b29652', fontSize: '13px', lineHeight: 1.7, paddingLeft: '4px' }}>
                      {entry.output}
                    </div>
                  )}
                </div>
              ))}

              {/* dashboard output inline */}
              {activated && !collapsed && (
                <DashOutput
                  devices={devices}
                  alerts={alerts}
                  selectedDev={selectedDev}
                  selectedMac={selectedMac}
                  onSelect={setSelectedMac}
                  activeOnly={activeOnly}
                  setActiveOnly={setActiveOnly}
                  onUpdate={fetchAll}
                  onResolve={fetchAll}
                />
              )}

              {/* active prompt */}
              {bootDone && !collapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', lineHeight: '1.7', marginTop: '4px' }}>
                  <span style={{ color: '#e8a320', userSelect: 'none' }}>root</span>
                  <span style={{ color: '#8d7750', userSelect: 'none' }}>@</span>
                  <span style={{ color: '#7ab0c0', userSelect: 'none' }}>netwatch</span>
                  <span style={{ color: '#8d7750', userSelect: 'none' }}>~</span>
                  <span style={{ color: '#b29652', userSelect: 'none' }}>$</span>
                  <span style={{ position: 'relative', flex: 1 }}>
                    <span style={{ color: '#e8a320' }}>{input}</span>
                    <span style={{ animation: 'blink 1s infinite', color: '#e8a320' }}>█</span>
                    <input
                      ref={inputRef}
                      className="term-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%' }}
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── DASHBOARD PANE (after collapse) ── */}
        {collapsed && (
          <div style={{ flex: 1, padding: '28px 32px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
            <div className="dash-enter">

              {/* stat row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'ACTIVE DEVICES', val: devices.filter(d => Date.now() - new Date(d.lastSeen).getTime() < 60_000).length, accent: '#e8a320' },
                  { label: 'TOTAL DEVICES',  val: devices.length, accent: '#7ab0c0' },
                  { label: 'OPEN ALERTS',    val: alerts.length,  accent: alerts.length > 0 ? '#ff4d4f' : '#8d7750' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#0a0a0a',
                    border: `1px solid ${s.accent}22`,
                    borderLeft: `3px solid ${s.accent}`,
                    padding: '14px 20px',
                    minWidth: '160px',
                  }}>
                    <div style={{ fontSize: '10px', color: '#8d7750', letterSpacing: '0.2em', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: '30px', color: s.accent, fontWeight: 600 }}>{s.val}</div>
                  </div>
                ))}

                {/* ascii cat stat card */}
                <div style={{
                  background: '#0a0a0a',
                  border: '1px solid #2a1a0022',
                  borderLeft: '3px solid #3a2a00',
                  padding: '10px 16px',
                  minWidth: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: '#8d7750', letterSpacing: '0.2em', marginBottom: '4px' }}>MASCOT</div>
<div style={{ fontSize: '11px', color: '#c8a870', lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div>{'/\\_/\\'}</div>
                    <div className="cat-eyes">{'(o . o)'}</div>
                    <div>{'> ^ <'}</div>
                  </div>
                </div>
              </div>

              {/* main grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* devices */}
                  <div style={{ background: '#0a0a0a', border: '1px solid #1a1500' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a1500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8d7750', letterSpacing: '0.2em', marginBottom: '4px' }}>├── DEVICE_INVENTORY</div>
                        <div style={{ fontSize: '15px', color: '#c8a870' }}>
                          <span style={{ color: '#b29652' }}>$</span> ls -la /dev/endpoints
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b29652', fontSize: '11px', cursor: 'pointer', border: '1px solid #1a1500', padding: '6px 12px' }}>
                        <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ accentColor: '#e8a320' }} />
                        --active-only
                      </label>
                    </div>
                    <DeviceTable devices={devices} onSelect={setSelectedMac} selectedMac={selectedMac} onUpdate={fetchAll} />
                  </div>

                  {/* rssi */}
                  <div style={{ background: '#0a0a0a', border: '1px solid #1a1500', padding: '18px' }}>
                    <div style={{ fontSize: '10px', color: '#8d7750', letterSpacing: '0.2em', marginBottom: '4px' }}>└── RSSI_HISTORY</div>
                    <div style={{ fontSize: '13px', color: '#b29652', marginBottom: '14px' }}>
                      <span style={{ color: '#b29652' }}>$</span> plot --signal{selectedDev ? ` --mac=${selectedDev.mac}` : ' --select-device'}
                    </div>
                    <RSSIChart device={selectedDev} />
                  </div>
                </div>

                {/* alerts */}
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1500' }}>

  <div
    style={{
      padding: '14px 20px',
      borderBottom: '1px solid #1a1500',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
    <div>
      <div
        style={{
          fontSize: '10px',
          color: alerts.length > 0 ? '#ff4d4f44' : '#8d7750',
          letterSpacing: '0.2em',
          marginBottom: '4px'
        }}
      >
        ├── ALERT_DAEMON
      </div>

      <div
        style={{
          fontSize: '15px',
          color: '#c8a870'
        }}
      >
        <span style={{ color: '#b29652' }}>$</span> tail -f /var/log/anomaly
      </div>
    </div>

    {alerts.length > 0 && (
      <span
        style={{
          color: '#ff4d4f',
          fontSize: '11px',
          animation: 'pulse 1s infinite'
        }}
      >
        [!!{String(alerts.length).padStart(2,'0')}!!]
      </span>
    )}
  </div>


  <div
    style={{
      padding:'12px',
      display:'flex',
      flexDirection:'column',
      minHeight:'calc(100vh - 320px)'
    }}
  >

    {alerts.length === 0 && (
      <div
        style={{
          padding:'20px',
          textAlign:'center',
          fontSize:'11px',
          color:'#6f5c28',
          letterSpacing:'0.15em'
        }}
      >
        <div style={{ marginBottom:'4px' }}>{'/\\_/\\'}</div>

        <div
          style={{ marginBottom:'4px' }}
          className="cat-eyes"
        >
          {'(- . -)'}
        </div>

        <div style={{ marginBottom:'8px' }}>{'>  <'}</div>

        <div style={{ marginBottom:'6px' }}>
          {'>_ no anomalies detected'}
        </div>

        <div>
          // system nominal — cat is calm
        </div>
      </div>
    )}


    <AlertList
      alerts={alerts}
      onResolve={fetchAll}
    />


    {/* bottom filler pushes cat into empty vertical gap */}
    <div
      style={{
        flex:1,
        display:'flex',
        alignItems:'flex-end',
        justifyContent:'center',
        paddingTop:'24px'
      }}
    >
      <div
        style={{
          textAlign:'center',
          border:'1px solid #433515',
          background:'#0f0f0f',
          padding:'12px 14px',
          width:'220px'
        }}
      >
        <div
          style={{
            fontSize:'10px',
            color:'#8d7750',
            letterSpacing:'0.18em',
            marginBottom:'8px'
          }}
        >
          └── CAT_DAEMON
        </div>

        <div
          style={{
            fontSize:'11px',
            color:'#b29652',
            marginBottom:'10px'
          }}
        >
          $ watch cat-monitor --tail
        </div>

        <img
          src="/cat.gif"
          alt="cat daemon"
          style={{
            width:'170px',
            maxWidth:'100%',
            imageRendering:'pixelated',
            border:'1px solid #6f5c28'
          }}
        />

        <div
          style={{
            marginTop:'8px',
            color:'#6f5c28',
            fontSize:'10px'
          }}
        >
          process status: purring
        </div>
        </div>
        </div>
         </div>  {/* ADD THIS — closes inner alerts content wrapper (the padding:'12px' div) */}
</div>

              </div>

              {/* footer with cat */}
              <div style={{ marginTop: '28px', paddingTop: '14px', borderTop: '1px solid #1a1500', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#1a1400', letterSpacing: '0.12em' }}>
                <span style={{ color: '#6f5c28' }}>// netmonitor v2.4.1 — arch linux — rolling</span>
                <span style={{ color: '#6f5c28' }}>{'>^..^<'} &nbsp; watching the net</span>
                <span>poll={POLL_MS}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}