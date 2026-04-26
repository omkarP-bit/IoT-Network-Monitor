const express = require('express');
const { Device } = require('../db/mongo');

const router = express.Router();

// GET /api/devices — list all tracked devices
router.get('/', async (req, res) => {
  const { limit = 50, active } = req.query;

  const query = {};
  if (active === 'true') {
    // "active" = seen in the last 60 seconds
    query.lastSeen = { $gte: new Date(Date.now() - 60_000) };
  }

  const devices = await Device.find(query)
    .sort({ lastSeen: -1 })
    .limit(Number(limit))
    .lean();

  res.json(devices);
});

// GET /api/devices/:mac — single device detail + RSSI history
router.get('/:mac', async (req, res) => {
  const device = await Device.findOne({ mac: req.params.mac }).lean();
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

// PATCH /api/devices/:mac/whitelist — mark device as known/safe
router.patch('/:mac/whitelist', async (req, res) => {
  const device = await Device.findOneAndUpdate(
    { mac: req.params.mac },
    { $set: { isKnown: true } },
    { new: true }
  );
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

module.exports = router;