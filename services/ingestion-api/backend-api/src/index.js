require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const client   = require('prom-client');
const { connectMongo } = require('./db/mongo');
const deviceRoutes = require('./routes/devices');
const alertRoutes  = require('./routes/alerts');

const app  = express();
const PORT = process.env.PORT || 4000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.use(cors());
app.use(express.json());

app.use('/api/devices', deviceRoutes);
app.use('/api/alerts',  alertRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'backend-api' }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

(async () => {
  await connectMongo();
  app.listen(PORT, () => console.log(`[backend-api] Listening on port ${PORT}`));
})();