#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_wifi.h"

// ─── CONFIG ────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";       // AP to connect for uplink
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* INGESTION_URL = "http://YOUR_SERVER_IP:3000/api/packets";

const uint8_t SNIFF_CHANNEL = 1;   // Channel to sniff (1–13); change as needed
const uint32_t SEND_INTERVAL_MS = 2000;  // Batch send every 2 seconds
// ───────────────────────────────────────────────────────────────────────────

// Queue to hold captured packet metadata before sending
#define QUEUE_SIZE 50

struct PacketInfo {
  char    mac[18];       // Source MAC  "AA:BB:CC:DD:EE:FF"
  int8_t  rssi;
  uint8_t frameType;     // 0=Management 1=Control 2=Data
  uint8_t frameSubtype;
  uint32_t timestamp;    // millis()
};

QueueHandle_t packetQueue;

// ─── PROMISCUOUS CALLBACK ──────────────────────────────────────────────────
// Called by the WiFi driver for every sniffed frame.
// Runs in an ISR context — keep it fast, no heap alloc, no Serial.
void IRAM_ATTR snifferCallback(void* buf, wifi_promiscuous_pkt_type_t type) {
  if (type == WIFI_PKT_MISC) return;  // skip misc/corrupt frames

  const wifi_promiscuous_pkt_t* pkt =
      reinterpret_cast<const wifi_promiscuous_pkt_t*>(buf);
  // 802.11 frame starts at pkt->payload
  // Bytes 10-15 are the Source Address (SA) for most frame types
  const uint8_t* payload = pkt->payload;
  uint8_t frameCtrl0 = payload[0];  // Frame Control byte 0
  uint8_t frameCtrl1 = payload[1];  // Frame Control byte 1 (unused here)

  uint8_t frameType    = (frameCtrl0 & 0x0C) >> 2;  // bits 3:2
  uint8_t frameSubtype = (frameCtrl0 & 0xF0) >> 4;  // bits 7:4

  // Source MAC is at bytes [10..15] for Data/Mgmt frames
  const uint8_t* src = payload + 10;

  PacketInfo info;
  snprintf(info.mac, sizeof(info.mac),
           "%02X:%02X:%02X:%02X:%02X:%02X",
           src[0], src[1], src[2], src[3], src[4], src[5]);

  info.rssi        = pkt->rx_ctrl.rssi;
  info.frameType   = frameType;
  info.frameSubtype= frameSubtype;
  info.timestamp   = millis();

  // Non-blocking push; drop packet if queue is full (ISR-safe)
  xQueueSendFromISR(packetQueue, &info, nullptr);
}
// ─── SETUP ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[SNIFFER] Booting...");

  packetQueue = xQueueCreate(QUEUE_SIZE, sizeof(PacketInfo));
  if (!packetQueue) {
    Serial.println("[ERROR] Failed to create packet queue. Halting.");
    while (true) delay(1000);
  }

  // ── Connect to AP for HTTP uplink ──
  Serial.printf("[WIFI] Connecting to %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint8_t retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Failed to connect. Running offline (no HTTP uplink).");
  }

  // ── Enable promiscuous mode ──
  esp_wifi_set_promiscuous(false);                      // reset first
  esp_wifi_set_channel(SNIFF_CHANNEL, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous_rx_cb(&snifferCallback);
  esp_wifi_set_promiscuous(true);

  Serial.printf("[SNIFFER] Listening on channel %d\n", SNIFF_CHANNEL);
}
// ─── LOOP ──────────────────────────────────────────────────────────────────
void loop() {
  static uint32_t lastSend = 0;

  if (millis() - lastSend < SEND_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastSend = millis();

  // Drain the queue into a JSON array
  uint8_t count = 0;
  PacketInfo items[QUEUE_SIZE];
  PacketInfo tmp;

  while (count < QUEUE_SIZE && xQueueReceive(packetQueue, &tmp, 0) == pdTRUE) {
    items[count++] = tmp;
  }

  if (count == 0) return;  // nothing to send

  // ── Build JSON payload ──
  // {"node_id":"ESP32-01","packets":[{"mac":"..","rssi":-70,"type":0,"subtype":4,"ts":12345},...]}
  DynamicJsonDocument doc(4096);
  doc["node_id"] = "ESP32-01";           // unique per device; change per board
  JsonArray arr = doc.createNestedArray("packets");

  for (uint8_t i = 0; i < count; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["mac"]     = items[i].mac;
    obj["rssi"]    = items[i].rssi;
    obj["type"]    = items[i].frameType;
    obj["subtype"] = items[i].frameSubtype;
    obj["ts"]      = items[i].timestamp;
  }

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[SEND] %d packets → %s\n", count, INGESTION_URL);
  Serial.println(payload);

  // ── HTTP POST ──
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(INGESTION_URL);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.printf("[HTTP] Response: %d\n", httpCode);
    } else {
      Serial.printf("[HTTP] Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP] Skipped — not connected.");
  }
}
