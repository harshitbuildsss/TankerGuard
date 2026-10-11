# TankerGuard — Water-Loss Intelligence Platform

TankerGuard is a full-stack prototype designed to identify suspicious water-volume reductions during tanker transit and help operations teams investigate potential water loss.

It combines a React/Vite operations dashboard with a Java Spring Boot REST API. The application supports tanker monitoring, telemetry history, incident management, simulated detection scenarios, and an AWS-hosted deployment.

> **Prototype data notice:** TankerGuard's leak, normal-transit, and authorized-delivery scenarios generate simulated telemetry. These values and coordinates are not live Delhi Jal Board (DJB) measurements. A flagged anomaly is a reason to investigate, not proof of a leak or theft.

---

## Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Live Deployment](#live-deployment)
- [Requirements](#requirements)
- [Run Locally](#run-locally)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Simulation Lab](#simulation-lab)
- [Build and Verification](#build-and-verification)
- [Current Prototype Snapshot](#current-prototype-snapshot)
- [Limitations and Future Work](#limitations-and-future-work)
- [Disclaimer](#disclaimer)

---

## Key Features

### Operations Dashboard
- Summarizes registered tankers, telemetry events, incidents, and estimated water loss.
- Displays backend connectivity and data-refresh status.
- Provides visible loading, empty, and error states.

### Tanker Monitoring
- Lists registered tanker records and available tanker details.
- Displays recorded incident coordinates on a map.
- Distinguishes incident locations from live vehicle tracking.

### Telemetry History
- Retrieves telemetry records for a selected tanker.
- Displays recorded water volume, coordinates, movement status, delivery authorization, valve state, outlet flow, and event source when available.
- Identifies synthetic demo records.

### Incident Management
- Lists reported incidents and supports status filtering.
- Provides an investigation interface for reviewing incidents.
- Supports updating incident status and adding an investigation note.

### Simulation Lab
- **Possible leak:** Generates a simulated water-volume anomaly.
- **Normal transit:** Demonstrates expected water-volume behavior.
- **Authorized delivery:** Demonstrates water-volume reduction associated with an authorized delivery.

The scenarios demonstrate the application's workflow; they do not establish real-world detection accuracy.

### AWS Deployment
- React/Vite frontend hosted through an Amazon S3 static website endpoint.
- Amazon API Gateway provides the configured API entry point.
- AWS Elastic Beanstalk runs the Spring Boot backend.
- The frontend communicates with the backend through HTTP API requests.
- The architecture modal in the dashboard explains the deployed application flow.

---

## System Architecture

```text
                         USER
                           |
                           v
                React + Vite Dashboard
                           |
                           v
                   Amazon S3 Hosting
                  Static Website Endpoint
                           |
                           | Browser loads frontend
                           v
                React Dashboard in Browser
                           |
                           | HTTPS API requests
                           v
                   Amazon API Gateway
                           |
                           | Configured proxy route
                           v
                AWS Elastic Beanstalk
                           |
                           v
                   Spring Boot REST API
                           |
              +------------+------------+
              |            |            |
              v            v            v
           Tankers      Telemetry    Incidents
              |
              v
       Persistent Backend Data
```

**Important:** The browser loads the frontend from S3 and then sends API requests to API Gateway. API Gateway forwards those requests to the deployed backend.

The diagram describes the application request flow. The exact production database service and its deployment configuration should not be inferred from this diagram.

### Application Responsibilities

| Component | Responsibility |
|---|---|
| React + Vite | Renders the operations dashboard and user interface. |
| Amazon S3 | Hosts the built frontend files. |
| Amazon API Gateway | Provides the configured API entry point. |
| AWS Elastic Beanstalk | Runs the Spring Boot backend application. |
| Spring Boot REST API | Handles application requests, simulations, and operational workflows. |
| Persistence layer | Stores tanker, telemetry, and incident records according to the backend configuration. |
| Leaflet + OpenStreetMap | Displays recorded incident coordinates on a map. |

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Leaflet
- React Leaflet
- Lucide React
- CSS

### Backend

- Java
- Spring Boot
- Maven
- Spring Data JPA
- Hibernate
- H2 for local persistence

### Cloud and Hosting

- Amazon S3 — static frontend hosting
- Amazon API Gateway — API entry point
- AWS Elastic Beanstalk — Spring Boot backend hosting

### Maps

- Leaflet
- OpenStreetMap tiles

The locally configured database and the deployed database configuration may differ. Consult the backend configuration before assuming that the deployed application uses H2 or a particular AWS database service.

---

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
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
├── README.md
├── start-backend.ps1
└── start-frontend.ps1
```

Generated build output, installed dependencies, local environment files, and local database files should not be committed to Git.

---

## Live Deployment

TankerGuard has been deployed to AWS for demonstration.

| Component | Deployment |
|---|---|
| Frontend | Amazon S3 static website hosting |
| API entry point | Amazon API Gateway |
| Backend | AWS Elastic Beanstalk |
| AWS Region | Asia Pacific (Mumbai), `ap-south-1` |

### Open the Application

**Live dashboard:**

http://tankerguard-frontend-2026.s3-website.ap-south-1.amazonaws.com/

**Configured API base URL:**

https://u3clteeo1a.execute-api.ap-south-1.amazonaws.com

The API base URL is intended for application API requests. Opening the root URL in a browser may return a 404 response if no route is mapped to `/`. This does not, by itself, mean that the API routes are unavailable.

### Hosting Notes

- The frontend is served through the S3 static website endpoint.
- S3 website endpoints do not provide HTTPS directly.
- The API Gateway endpoint uses HTTPS.
- HTTPS for the frontend would require an HTTPS-capable hosting configuration, such as CloudFront with the appropriate setup or another suitable hosting service.
- A successful frontend page load does not independently prove that every backend endpoint is healthy. The application also checks backend connectivity.

### Frontend Configuration

The production frontend uses the following environment variable:

```env
VITE_API_BASE_URL=https://u3clteeo1a.execute-api.ap-south-1.amazonaws.com
```

Vite embeds `VITE_` variables into the frontend build. Changes to the production API base URL therefore require rebuilding and redeploying the frontend.

---

## Requirements

To run the application locally, install:

- Java 17 or a compatible newer version
- Maven 3.9+
- Node.js and npm
- Internet access for OpenStreetMap tiles and optional Google Fonts resources

---

## Run Locally

### 1. Start the Backend

Open PowerShell in the project root:

```powershell
.\start-backend.ps1
```

The local API is expected to listen on port `8081`.

If the startup script fails, check the backend README and application configuration for the required Java version, database settings, and port.

### 2. Start the Frontend

Open a second PowerShell window in the project root:

```powershell
.\start-frontend.ps1
```

Open:

http://localhost:5173

The frontend uses `VITE_API_BASE_URL` to determine the API base URL.

For local development, the expected backend URL is:

```env
VITE_API_BASE_URL=http://localhost:8081
```

Use the actual variable configuration supported by your frontend setup. Do not commit secrets or local-only environment files.

---

## Configuration

### Frontend

The frontend API client uses `VITE_API_BASE_URL` to build requests to the backend.

Example:

```env
VITE_API_BASE_URL=http://localhost:8081
```

For the deployed frontend:

```env
VITE_API_BASE_URL=https://u3clteeo1a.execute-api.ap-south-1.amazonaws.com
```

### Backend

The backend configuration determines:

- Server port
- Database connection and persistence behavior
- CORS rules
- API endpoint availability
- Runtime behavior in local and deployed environments

Review the actual backend configuration before changing these values.

Do not commit passwords, access keys, tokens, or other credentials.

---

## API Reference

The following table documents the application's intended API surface. Confirm endpoint mappings in the current backend source before using them in an external integration.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health, if exposed by the current configuration |
| GET | `/api/dashboard/summary` | Dashboard metrics and prototype-data notice |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents?status=OPEN` | Filter incidents by status |
| GET | `/api/incidents/tanker/{tankerId}` | Retrieve incidents for a tanker |
| PATCH | `/api/incidents/{id}/status` | Update incident status and optional note |
| GET | `/api/tankers` | List registered tankers |
| GET | `/api/tankers/{id}` | Retrieve a tanker |
| POST | `/api/tankers` | Register a tanker |
| GET | `/api/telemetry/{tankerId}` | Retrieve telemetry history for a tanker |
| POST | `/api/telemetry` | Submit a telemetry event |
| POST | `/api/demo/scenario/leak` | Generate a simulated leak scenario |
| POST | `/api/demo/scenario/normal` | Generate a simulated normal-transit scenario |
| POST | `/api/demo/scenario/delivery` | Generate a simulated authorized-delivery scenario |

### Example API Requests

When the local backend is running, the following requests can be used to inspect common resources.

**Dashboard summary**

```powershell
curl.exe http://localhost:8081/api/dashboard/summary
```

**Registered tankers**

```powershell
curl.exe http://localhost:8081/api/tankers
```

**Incidents**

```powershell
curl.exe http://localhost:8081/api/incidents
```

**Tanker telemetry**

Replace the tanker ID with one returned by the backend:

```powershell
curl.exe http://localhost:8081/api/telemetry/DJB-DEMO-100-R001
```

**Trigger a leak simulation**

```powershell
curl.exe -X POST http://localhost:8081/api/demo/scenario/leak
```

Use the frontend Simulation Lab if the backend expects a particular request body or scenario configuration. Repeated leak simulations may create additional telemetry records and incidents.

---

## Simulation Lab

The Simulation Lab demonstrates three possible operating conditions.

### 1. Possible Leak in Transit

Generates synthetic telemetry containing a water-volume reduction that may trigger the application's anomaly rules.

The resulting incident can be reviewed through the incident management interface.

### 2. Normal Transit

Generates synthetic telemetry representing expected transit behavior.

This scenario helps demonstrate the intended distinction between ordinary movement and suspicious volume changes.

### 3. Authorized Delivery

Generates synthetic telemetry representing a water-volume reduction associated with an authorized delivery.

This scenario demonstrates why delivery context matters when evaluating potential water loss.

### Important Interpretation

A volume reduction alone does not establish a leak or theft. A production implementation would need validated sensor readings, reliable delivery records, calibrated thresholds, and operational investigation.

---

## Build and Verification

### Frontend

From the project root:

```powershell
Set-Location .\frontend
npm ci
npm run build
```

A successful build verifies that Vite can compile the frontend.

### Backend

From the project root:

```powershell
Set-Location .\backend
mvn -DskipTests package
```

This packages the backend without executing tests. It does not establish that all backend behavior is correct.

### Verify the Local API

Start the backend and run:

```powershell
curl.exe http://localhost:8081/api/dashboard/summary
curl.exe http://localhost:8081/api/tankers
curl.exe http://localhost:8081/api/incidents
```

The responses should be checked against the actual API contract and the data available in the current environment.

### Verify the Deployed Application

Before a demonstration:

1. Open the deployed frontend.
2. Confirm that the dashboard loads.
3. Check the displayed backend connection status.
4. Open the tanker monitoring and telemetry pages.
5. Run a simulation and verify the resulting dashboard or incident changes.
6. Open an incident and test its status-update workflow.
7. Open the AWS architecture modal.
8. Test the website on the device and browser that will be used for the presentation.

Keep screenshots or a short demonstration recording available as a fallback.

---

## Current Prototype Snapshot

A previous development instance returned the following dashboard values:

| Metric | Observed value |
|---|---:|
| Registered tankers | 13 |
| Telemetry events | 100 |
| Incidents | 11 |
| Open incidents | 4 |
| Estimated water loss | 2,880 litres |

These values are a historical prototype snapshot, not guaranteed current values. They are not production telemetry or independently verified water-loss measurements.

Running additional simulations can change the totals.

---

## Limitations and Future Work

TankerGuard demonstrates an end-to-end monitoring and investigation workflow, but it is not yet a validated production water-loss detection system.

### Data and Detection

- Demo scenarios use synthetic telemetry and coordinates.
- No physical sensors, GPS hardware, or live DJB integration is included.
- Detection thresholds have not been established as operationally validated.
- An anomaly is an investigation signal, not proof of theft or leakage.
- Current incident maps show recorded incident coordinates, not live tanker tracking.

### Persistence

- The backend persists tanker, telemetry, and incident records according to its configured persistence layer.
- H2 is used for local persistence.
- The deployed database service and its production durability characteristics should be confirmed from the actual deployment configuration.
- Production use would require a suitable durable database, tested migrations, backup procedures, and recovery planning.

### Security

Before exposing the application to untrusted users, review and implement appropriate:

- Authentication and authorization
- Input validation and request-size limits
- Production CORS restrictions
- Rate limiting and abuse protection
- Secure secrets and configuration management
- HTTPS for the frontend and API
- Logging, monitoring, and security alerting

### Reliability and Operations

Potential improvements include:

- Automated frontend and backend tests
- CI/CD deployment workflows
- Health checks and operational alerts
- Improved offline and failure handling
- Data retention and audit trails
- Validation against real sensor and delivery records
- Field testing with calibrated equipment

---

## Disclaimer

TankerGuard is a hackathon prototype demonstrating a possible water-transit monitoring and incident-investigation workflow.

Its simulated data, anomaly rules, and current implementation should not be interpreted as independently validated evidence of water theft, leakage, or actual DJB water loss.

Any operational deployment would require reliable telemetry, validated detection logic, appropriate security controls, durable persistence, and real-world testing.
