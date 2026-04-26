require('dotenv').config();
const express = require('express');
const client  = require('prom-client');
const packetRoutes = require('./routes/packets');
const { connectProducer } = require('./kafka/producer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Prometheus metrics ──────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const packetsReceived = new client.Counter({
  name: 'ingestion_packets_received_total',
  help: 'Total number of packet records received from ESP32 nodes',
  registers: [register],
});

app.locals.metrics = { packetsReceived };

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/packets', packetRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ingestion-api' }));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── Start ─────────────────────────────────────────────────────────────────────
(async () => {
  await connectProducer();
  app.listen(PORT, () => {
    console.log(`[ingestion-api] Listening on port ${PORT}`);
  });
})();