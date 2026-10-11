# Tanker Water-Loss Detection Backend (MVP)

Spring Boot REST backend for a hackathon prototype detecting *possible* abnormal water loss from a tanker. It stores tankers, telemetry, and incidents in a local H2 database; includes demo telemetry scenarios; and exposes dashboard/incident APIs.

> **Important:** this is a prototype, not a DJB integration. Demo telemetry is simulated. It has no connection to DJB GPS feeds, physical sensors, AWS IoT, SMS/WhatsApp, or real maintenance systems. A detection is a suspicion that requires human inspection, not proof of a leak.

## Requirements
- Java 17+
- Maven 3.9+ (or use an IDE with Maven support)

## Run
From this directory:

```powershell
mvn spring-boot:run
```

API runs at `http://localhost:8081`. H2 console: `http://localhost:8081/h2-console` (JDBC URL `jdbc:h2:file:./data/tankerdb`, username `sa`, blank password).

## Fast demo
In another PowerShell terminal:

```powershell
curl.exe -X POST http://localhost:8081/api/demo/scenario/leak
curl.exe http://localhost:8081/api/dashboard/summary
curl.exe http://localhost:8081/api/incidents
```

Available scenarios: `normal`, `delivery`, `leak`. They generate **simulated** data for `DJB-DEMO-247`. The leak scenario should create an incident; normal and authorized delivery scenarios should not create a new incident from their own sequence.

## API

### Health
`GET /api/health`

### Tankers
- `GET /api/tankers`
- `GET /api/tankers/{tankerId}`
- `POST /api/tankers`

```json
{"tankerId":"DJB-247","name":"Tanker 247","capacityLiters":10000,"operatorName":"Demo operator"}
```

### Ingest telemetry
`POST /api/telemetry`

```json
{
  "eventId":"evt-0001",
  "tankerId":"DJB-247",
  "recordedAt":"2026-10-10T09:30:00Z",
  "waterVolumeLiters":9750,
  "latitude":28.6139,
  "longitude":77.2090,
  "moving":true,
  "deliveryAuthorized":false,
  "valveOpen":false,
  "outletFlowLitersPerMinute":0,
  "source":"simulated"
}
```

The tanker must already exist. Send an initial reading before sending a later reading for comparison. `eventId` is an idempotency key; a duplicate event is ignored.

### Telemetry history
`GET /api/telemetry/{tankerId}`

### Incidents
- `GET /api/incidents`
- `GET /api/incidents?status=OPEN`
- `GET /api/incidents/tanker/{tankerId}`
- `PATCH /api/incidents/{id}/status`

```json
{"status":"ACKNOWLEDGED","note":"Driver contacted; inspection pending"}
```

Valid statuses: `OPEN`, `ACKNOWLEDGED`, `MAINTENANCE_REQUIRED`, `RESOLVED`, `FALSE_ALARM`.

### Dashboard summary
`GET /api/dashboard/summary`

## Detection logic (transparent MVP heuristic)
An incident is created when consecutive volume readings show a drop of at least 50 L, the current event reports the tanker is moving, delivery is not authorised, the valve is reported closed, and measured outlet flow is at most 1 L/min. Severity is based on estimated drop size. Thresholds are illustrative and must be calibrated against sensor noise, tank geometry, vibration, sloshing, sampling interval, and real operating procedures before real deployment.

Limitations: the MVP compares consecutive readings and does not yet compensate for sloshing/vehicle tilt, sensor drift, missing/out-of-order data beyond ignoring older timestamps for detection, or route/geofence-based delivery authorisation. It does not prove a leak. A production version should use authenticated device identity, stronger idempotency/order handling, calibrated sensors, alert delivery, audit logging, role-based access, and a real delivery-state source.
