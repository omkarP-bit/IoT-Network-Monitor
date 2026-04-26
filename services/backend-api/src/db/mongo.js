const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/netmonitor';
  await mongoose.connect(uri);
  console.log('[mongo] Connected');
}

const Device = mongoose.model('Device', new mongoose.Schema({
  mac:         { type: String, unique: true },
  nodeId:      String,
  firstSeen:   Date,
  lastSeen:    Date,
  rssiHistory: [{ rssi: Number, ts: Date }],
  seenCount:   Number,
  isKnown:     Boolean,
}, { collection: 'devices' }));

const Alert = mongoose.model('Alert', new mongoose.Schema({
  type:      String,
  severity:  String,
  message:   String,
  mac:       String,
  nodeId:    String,
  createdAt: Date,
  resolved:  Boolean,
}, { collection: 'alerts' }));

const Packet = mongoose.model('Packet', new mongoose.Schema({
  nodeId:     String,
  mac:        String,
  rssi:       Number,
  frameType:  Number,
  subtype:    Number,
  receivedAt: Date,
}, { collection: 'packets' }));

module.exports = { connectMongo, Device, Alert, Packet };