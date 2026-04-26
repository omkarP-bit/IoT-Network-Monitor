const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ingestion-api',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log('[kafka] Producer connected');
}

/**
 * Publishes a batch of packet records to the raw-packets topic.
 * @param {string} nodeId  - ESP32 node identifier
 * @param {Array}  packets - Array of packet metadata objects
 */
async function publishPackets(nodeId, packets) {
  const messages = packets.map((pkt) => ({
    key: nodeId,
    value: JSON.stringify({ nodeId, ...pkt, receivedAt: Date.now() }),
  }));

  await producer.send({
    topic: 'raw-packets',
    messages,
  });
}

module.exports = { connectProducer, publishPackets };