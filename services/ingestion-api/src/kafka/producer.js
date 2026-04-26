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

async function publishPackets(nodeId, packets) {
  const messages = packets.map(function(pkt) {
    return {
      key: nodeId,
      value: JSON.stringify(Object.assign({ nodeId: nodeId }, pkt, { receivedAt: Date.now() })),
    };
  });
  await producer.send({ topic: 'raw-packets', messages: messages });
}

module.exports = { connectProducer, publishPackets };
