const express = require('express');
const { Alert } = require('../db/mongo');

const router = express.Router();

// GET /api/alerts
router.get('/', async (req, res) => {
  const { resolved = 'false', limit = 100 } = req.query;

  const alerts = await Alert.find({ resolved: resolved === 'true' })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { $set: { resolved: true } },
    { new: true }
  );
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

module.exports = router;