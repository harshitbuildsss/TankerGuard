# TankerGuard — Water-Loss Intelligence Platform

TankerGuard is a full-stack prototype for identifying suspicious water-volume reductions during tanker transit and managing the resulting inspection incidents. It combines a Spring Boot REST API with a React/Vite operations dashboard.

> **Prototype data notice:** TankerGuard's leak, normal-transit, and authorized-delivery scenarios generate simulated telemetry. These values and coordinates are not live Delhi Jal Board (DJB) measurements. A flagged anomaly is a reason to investigate, not proof of a leak or theft.

## Features

* Dashboard summarizing registered tankers, telemetry events, incidents, and estimated water loss.
* Incident investigation and status management.
* Registered tanker records and tanker-specific telemetry history.
* Incident-location map using Leaflet and OpenStreetMap.
* Simulation Lab for leak, normal-transit, and authorized-delivery scenarios.
* Backend-offline and API error states.
* Responsive React interface backed by a Spring Boot REST API.

## Technology Stack

**Frontend**

* React
* Vite
* Leaflet and React Leaflet
* Lucide React

**Backend**

* Java
* Spring Boot
* Maven
* Spring Data JPA / Hibernate
* H2 database for local persistence

## Project Structure

```text
TankerGuard/
├── .github/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
├── README.md
├── start-backend.ps1
└── start-frontend.ps1
```

Generated build output, installed dependencies, local environment files, and local database files should not be committed to Git.

## Requirements

* Java 17 or a compatible newer version
* Maven 3.9+
* Node.js and npm
* Internet access for OpenStreetMap tiles and optional Google Fonts resources

## Run Locally

### 1. Start the backend

Open PowerShell in the project root:

```powershell
.\start-backend.ps1
```

The API listens on port `8081`.

### 2. Start the frontend

Open a second PowerShell window in the project root:

```powershell
.\start-frontend.ps1
```

Open `http://localhost:5173` in your browser.

The frontend uses `VITE_API_BASE_URL` to configure the API address. See `frontend/.env.example` for the available configuration. The local backend URL is `http://localhost:8081`.

## API Endpoints

| Method | Endpoint                           | Purpose                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------- |
| GET    | `/api/health`                      | Backend health, if exposed by the current configuration |
| GET    | `/api/dashboard/summary`           | Dashboard metrics and prototype-data notice             |
| GET    | `/api/incidents`                   | List incidents                                          |
| GET    | `/api/incidents?status=OPEN`       | Filter incidents by status                              |
| PATCH  | `/api/incidents/{id}/status`       | Update incident status and optional note                |
| GET    | `/api/incidents/tanker/{tankerId}` | Retrieve incidents for a tanker                         |
| GET    | `/api/tankers`                     | List registered tankers                                 |
| GET    | `/api/tankers/{id}`                | Retrieve a tanker                                       |
| POST   | `/api/tankers`                     | Register a tanker                                       |
| GET    | `/api/telemetry/{tankerId}`        | Retrieve telemetry history for a tanker                 |
| POST   | `/api/telemetry`                   | Submit a telemetry event                                |
| POST   | `/api/demo/scenario/leak`          | Generate a simulated leak scenario                      |
| POST   | `/api/demo/scenario/normal`        | Generate a simulated normal-transit scenario            |
| POST   | `/api/demo/scenario/delivery`      | Generate a simulated authorized-delivery scenario       |

Check the current backend source before relying on an endpoint in an external integration.

## Build and Verify

### Frontend

```powershell
Set-Location .\frontend
npm ci
npm run build
```

### Backend

```powershell
Set-Location ..\backend
mvn -DskipTests package
```

### Inspect the running application

With the backend running:

```powershell
curl.exe http://localhost:8081/api/dashboard/summary
curl.exe http://localhost:8081/api/tankers
curl.exe http://localhost:8081/api/incidents
```

Demo scenarios can be triggered using the POST endpoints documented above. Repeated leak simulations may create additional incidents.

## Current Verification

The development instance has returned the following dashboard values:

* 13 registered tankers
* 100 telemetry events
* 11 incidents
* 4 open incidents
* 2,880 litres of estimated water loss

These are observed prototype values, not production telemetry or independently verified water-loss measurements.

## Limitations and Production Considerations

* Demo scenarios use synthetic telemetry and coordinates.
* No physical sensors, GPS hardware, or live DJB integration is included.
* Water-volume reductions are potential anomalies, not proof of theft or leakage.
* Real deployment would require calibrated sensors, validated detection thresholds, and field testing.
* The map displays recorded incident coordinates; it does not provide live tanker tracking.
* H2 is used for local persistence. A durable production database and a tested migration strategy are required for a production deployment.
* Authentication, authorization, request validation, rate limiting, production CORS configuration, and security monitoring must be reviewed and implemented before exposing the API to untrusted users.
* Production deployment also requires HTTPS, secure configuration management, backups, and operational monitoring.

TankerGuard is a working hackathon prototype demonstrating a possible water-transit monitoring and incident-investigation workflow. Its simulated data and current implementation should not be interpreted as a validated production water-loss detection system.
