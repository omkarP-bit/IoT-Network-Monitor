const express = require('express');
const Joi     = require('joi');
const { publishPackets } = require('../kafka/producer');

const router = express.Router();

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

router.post('/', async function(req, res) {
  if (!req.app.locals.kafkaReady) {
    return res.status(503).json({ error: 'Kafka not ready yet, retry in a few seconds' });
  }
  const result = bodySchema.validate(req.body);
  if (result.error) return res.status(400).json({ error: result.error.details[0].message });

  const node_id = result.value.node_id;
  const packets  = result.value.packets;
  try {
    await publishPackets(node_id, packets);
    req.app.locals.metrics.packetsReceived.inc(packets.length);
    return res.status(202).json({ accepted: packets.length, node_id: node_id });
  } catch (err) {
    console.error('[route] Failed to publish:', err.message);
    return res.status(500).json({ error: 'Failed to queue packets' });
  }
});

module.exports = router;
