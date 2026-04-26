const express = require('express');
const Joi     = require('joi');
const { publishPackets } = require('../kafka/producer');

const router = express.Router();

// ── Validation schema ────────────────────────────────────────────────────────
const packetSchema = Joi.object({
  mac:     Joi.string().pattern(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).required(),
  rssi:    Joi.number().min(-120).max(0).required(),
  type:    Joi.number().integer().min(0).max(3).required(),
  subtype: Joi.number().integer().min(0).max(15).required(),
  ts:      Joi.number().integer().required(),
});

const bodySchema = Joi.object({
  node_id: Joi.string().max(32).required(),
  packets: Joi.array().items(packetSchema).min(1).max(100).required(),
});

// ── POST /api/packets ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { error, value } = bodySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { node_id, packets } = value;

  try {
    await publishPackets(node_id, packets);

    // Update Prometheus counter
    req.app.locals.metrics.packetsReceived.inc(packets.length);

    return res.status(202).json({
      accepted: packets.length,
      node_id,
    });
  } catch (err) {
    console.error('[route] Failed to publish to Kafka:', err.message);
    return res.status(500).json({ error: 'Failed to queue packets' });
  }
});

module.exports = router;