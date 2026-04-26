require('dotenv').config();
const express = require('express');
const client  = require('prom-client');
const packetRoutes = require('./routes/packets');
const { connectProducer } = require('./kafka/producer');

const app  = express();
const PORT = process.env.PORT || 3000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });
const packetsReceived = new client.Counter({
  name: 'ingestion_packets_received_total',
  help: 'Total packet records received',
  registers: [register],
});

app.locals.metrics = { packetsReceived };
app.locals.kafkaReady = false;

app.use(express.json({ limit: '1mb' }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/packets', packetRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ingestion-api', kafka: app.locals.kafkaReady }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => console.log(`[ingestion-api] Listening on port ${PORT}`));

async function connectWithRetry(retries, delay) {
  retries = retries || 10;
  delay = delay || 5000;
  for (var i = 1; i <= retries; i++) {
    try {
      await connectProducer();
      app.locals.kafkaReady = true;
      console.log('[ingestion-api] Kafka ready');
      return;
    } catch (err) {
      console.log('[ingestion-api] Kafka not ready, retry ' + i + '/' + retries + ' in ' + delay/1000 + 's');
      await new Promise(function(r){ setTimeout(r, delay); });
    }
  }
  console.error('[ingestion-api] Could not connect to Kafka after retries');
}
connectWithRetry();
