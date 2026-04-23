# 📡 IoT-Based Distributed Network Monitoring System

---

## 🧠 Overview

This project is a **distributed network observability platform** that uses ESP32-based packet sniffers and a cloud-native backend to monitor Wi-Fi network behavior in real time.

Unlike traditional tools such as Wireshark, this system focuses on **metadata analysis (MAC, RSSI, timing)** instead of payload inspection, ensuring privacy while enabling anomaly detection.

---

## 🎯 Goals

* Provide **real-time visibility** into Wi-Fi networks
* Enable **distributed packet monitoring using IoT devices**
* Build a **scalable backend using streaming architecture**
* Detect anomalies such as:

  * Rogue devices
  * Traffic spikes
  * MAC spoofing patterns
* Demonstrate **DevOps practices** using containerization and orchestration

---

## 🏗️ High-Level Architecture

```
+---------------------+
|   ESP32 Sniffers    |
| (Promiscuous Mode)  |
+----------+----------+
           |
           v
+---------------------+
|   Ingestion API     |
| (Node.js / Express) |
+----------+----------+
           |
           v
+---------------------+
|   Message Queue     |
|   (Apache Kafka)    |
+----------+----------+
           |
           v
+---------------------------+
| Processing / Analytics    |
| (Anomaly Detection Logic) |
+----------+----------------+
           |
           v
+---------------------+
|     Database        |
|     (MongoDB)       |
+----------+----------+
           |
           v
+---------------------+
|    Backend API      |
+----------+----------+
           |
           v
+---------------------+
|   Frontend (React)  |
+---------------------+
```

---

## 🔄 Data Flow

1. **Packet Capture (Edge Layer)**
   ESP32 devices capture Wi-Fi frames in promiscuous mode and extract:

   * MAC Address
   * RSSI (signal strength)
   * Frame metadata

2. **Data Ingestion**
   ESP32 sends captured data to the ingestion API via HTTP (JSON format).

3. **Streaming Pipeline**
   Ingestion service publishes data to Apache Kafka topics.

4. **Processing Layer**
   Consumer service processes incoming data and performs:

   * Device tracking
   * Signal strength analysis
   * Anomaly detection

5. **Storage Layer**
   Processed data is stored in MongoDB.

6. **API Layer**
   Backend exposes REST APIs for frontend consumption.

7. **Visualization Layer**
   React dashboard displays:

   * Active devices
   * RSSI trends
   * Alerts

---

## 🧩 Core Components

### 1. ESP32 Sniffer Nodes

* Operate in promiscuous mode
* Capture Wi-Fi packet metadata
* Lightweight and distributed

---

### 2. Ingestion Service

* Receives HTTP POST data from ESP32
* Validates and forwards to Kafka
* Stateless and horizontally scalable

---

### 3. Message Queue (Apache Kafka)

* Handles high-throughput data ingestion
* Decouples producers and consumers
* Enables scalability and fault tolerance

---

### 4. Processing Service

* Consumes Kafka messages
* Implements anomaly detection logic:

  * New device detection
  * Device disappearance
  * RSSI fluctuation anomalies
  * Traffic spikes

---

### 5. Database (MongoDB)

* Stores processed device data
* Enables querying and historical analysis

---

### 6. Backend API

* Provides REST endpoints:

  * `/devices`
  * `/alerts`
* Acts as bridge between data layer and frontend

---

### 7. Frontend Dashboard

* Built with React
* Displays:

  * Real-time device list
  * Signal strength trends
  * Alerts panel

---

## ⚙️ DevOps & Deployment

### Containerization

* All services containerized using Docker

### Orchestration

* Deployed on Kubernetes:

  * Deployments
  * Services
  * Ingress

### CI/CD

* Automated using GitHub Actions:

  * Build
  * Test
  * Deploy

---

## 📊 Observability

* Metrics exposed from services:

  * `packets_received_total`
  * `devices_detected`
  * `anomalies_detected`

* Monitoring stack:

  * Prometheus → Metrics collection
  * Grafana → Visualization dashboards

---

## 🔐 Security Considerations

* No payload inspection (privacy-safe)
* Only metadata is processed
* TLS used for backend communication
* Kubernetes RBAC for access control

---

## ⚠️ Limitations

* Cannot decrypt HTTPS traffic
* ESP32 hardware limitations (memory, CPU)
* Limited to Wi-Fi-based monitoring
* Accuracy depends on deployment density

---

## 🚀 Future Enhancements

* Machine Learning-based anomaly detection
* RSSI-based location estimation
* Integration with Istio for Kubernetes traffic observability
* Cloud deployment (AWS/GCP/Azure)
* Mobile dashboard application

---

## 📌 Summary

This system demonstrates a **modern DevOps + Networking solution** by combining:

* IoT-based packet sniffing
* Streaming architecture
* Microservices design
* Kubernetes deployment
* Real-time observability

It provides a scalable and privacy-aware approach to network monitoring suitable for smart environments and research applications.

---

## Contributors

Omkar Patil, Smrutikant Parida, Paras Sarode, Omar Khan, Kushal Kurkure

---
