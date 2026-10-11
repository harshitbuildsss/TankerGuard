package com.kaamsafe.tanker.service;

import com.kaamsafe.tanker.dto.*;
import com.kaamsafe.tanker.model.*;
import com.kaamsafe.tanker.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class WaterLossService {

    private static final double MIN_SUSPICIOUS_DROP_LITERS = 50.0;
    private static final double MAX_FLOW_FOR_UNEXPLAINED_LOSS = 1.0;

    private static final double DEMO_TANKER_CAPACITY_LITERS = 10000.0;

    /*
     * Synthetic demonstration locations.
     * These are illustrative coordinates, not verified tanker routes.
     */
    private static final double[][] DEMO_LOCATIONS = {
        {28.6139, 77.2090},
        {28.6200, 77.2150},
        {28.6050, 77.2200},
        {28.6250, 77.2000},
        {28.6000, 77.2050},
        {28.6300, 77.2250}
    };

    /*
     * Different leak sizes for demonstration.
     * The detected loss is calculated from telemetry readings.
     */
    private static final double[] DEMO_LEAK_DROPS = {
        120.0,
        230.0,
        380.0,
        650.0
    };

    private final TankerRepository tankers;
    private final TelemetryRepository telemetry;
    private final IncidentRepository incidents;

    /*
     * Sequences are used only to distinguish demo runs during this
     * application process. They are not a persistent production counter.
     */
    private final AtomicLong demoRunCounter = new AtomicLong();

    public WaterLossService(
            TankerRepository tankers,
            TelemetryRepository telemetry,
            IncidentRepository incidents) {

        this.tankers = tankers;
        this.telemetry = telemetry;
        this.incidents = incidents;
    }

    public List<Tanker> listTankers() {
        return tankers.findAll();
    }

    public Tanker getTanker(String id) {
        return tankers.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Tanker not found"
                        ));
    }

    public Tanker createTanker(CreateTankerRequest request) {
        if (tankers.existsById(request.tankerId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tanker ID already exists"
            );
        }

        return tankers.save(
                new Tanker(
                        request.tankerId(),
                        request.name(),
                        request.capacityLiters(),
                        request.operatorName()
                )
        );
    }

    @Transactional
    public TelemetryResult ingest(TelemetryRequest request) {

        if (telemetry.existsById(request.eventId())) {
            return new TelemetryResult(
                    request.eventId(),
                    true,
                    false,
                    null,
                    null,
                    "Duplicate event ignored (idempotent retry)"
            );
        }

        Tanker tanker = getTanker(request.tankerId());

        if (request.waterVolumeLiters() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Water volume cannot be negative"
            );
        }

        if (request.waterVolumeLiters() >
                tanker.getCapacityLiters() * 1.02) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Reported water volume exceeds tanker capacity"
            );
        }

        if (request.outletFlowLitersPerMinute() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Outlet flow cannot be negative"
            );
        }

        TelemetryEvent previous =
                telemetry.findTopByTankerIdOrderByRecordedAtDesc(
                        request.tankerId()
                ).orElse(null);

        Instant time = request.recordedAt() == null
                ? Instant.now()
                : request.recordedAt();

        String source = request.source() == null
                || request.source().isBlank()
                ? "simulated"
                : request.source();

        TelemetryEvent current = new TelemetryEvent(
                request.eventId(),
                request.tankerId(),
                time,
                request.waterVolumeLiters(),
                request.latitude(),
                request.longitude(),
                request.moving(),
                request.deliveryAuthorized(),
                request.valveOpen(),
                request.outletFlowLitersPerMinute(),
                source
        );

        telemetry.save(current);

        /*
         * Do not compare against missing or newer telemetry.
         * Authorized deliveries and open valves are excluded.
         */
        if (previous == null
                || !time.isAfter(previous.getRecordedAt())
                || request.deliveryAuthorized()
                || request.valveOpen()) {

            return new TelemetryResult(
                    request.eventId(),
                    false,
                    false,
                    null,
                    null,
                    "Telemetry recorded; no unexplained-loss check triggered"
            );
        }

        double drop =
                previous.getWaterVolumeLiters()
                        - request.waterVolumeLiters();

        boolean unexplainedDrop =
                drop >= MIN_SUSPICIOUS_DROP_LITERS
                && request.moving()
                && !request.deliveryAuthorized()
                && !request.valveOpen()
                && request.outletFlowLitersPerMinute()
                        <= MAX_FLOW_FOR_UNEXPLAINED_LOSS;

        if (!unexplainedDrop) {
            return new TelemetryResult(
                    request.eventId(),
                    false,
                    false,
                    null,
                    null,
                    "Telemetry recorded; no suspicious loss detected"
            );
        }

        IncidentSeverity severity =
                drop >= 500
                        ? IncidentSeverity.HIGH
                        : drop >= 150
                                ? IncidentSeverity.MEDIUM
                                : IncidentSeverity.LOW;

        String reason = String.format(
                Locale.ROOT,
                "Water volume dropped by %.0f L between consecutive "
                        + "readings while the tanker was moving; no "
                        + "authorised delivery or outlet flow was reported. "
                        + "Sensor-based suspicion only; inspect to confirm.",
                drop
        );

        WaterLossIncident incident = incidents.save(
                new WaterLossIncident(
                        request.tankerId(),
                        time,
                        drop,
                        request.latitude(),
                        request.longitude(),
                        severity,
                        reason,
                        source
                )
        );

        return new TelemetryResult(
                request.eventId(),
                false,
                true,
                incident.getId(),
                drop,
                "Possible water loss detected; driver/dispatcher inspection required"
        );
    }

    public List<TelemetryEvent> telemetryFor(String tankerId) {
        getTanker(tankerId);
        return telemetry.findTop100ByTankerIdOrderByRecordedAtDesc(
                tankerId
        );
    }

    public List<WaterLossIncident> allIncidents(IncidentStatus status) {
        return status == null
                ? incidents.findAllByOrderByDetectedAtDesc()
                : incidents.findByStatusOrderByDetectedAtDesc(status);
    }

    public List<WaterLossIncident> incidentsForTanker(String tankerId) {
        getTanker(tankerId);
        return incidents.findByTankerIdOrderByDetectedAtDesc(tankerId);
    }

    @Transactional
    public WaterLossIncident updateIncident(
            Long id,
            IncidentStatusRequest request) {

        WaterLossIncident incident = incidents.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Incident not found"
                        ));

        incident.updateStatus(request.status(), request.note());

        return incidents.save(incident);
    }

    public Map<String, Object> dashboard() {

        List<WaterLossIncident> all = incidents.findAll();

        double estimatedLiters = all.stream()
                .filter(i ->
                        i.getStatus() != IncidentStatus.FALSE_ALARM)
                .mapToDouble(
                        WaterLossIncident::getEstimatedLossLiters
                )
                .sum();

        long open = all.stream()
                .filter(i ->
                        i.getStatus() == IncidentStatus.OPEN
                        || i.getStatus() == IncidentStatus.ACKNOWLEDGED
                        || i.getStatus()
                                == IncidentStatus.MAINTENANCE_REQUIRED)
                .count();

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("registeredTankers", tankers.count());
        result.put("telemetryEvents", telemetry.count());
        result.put("totalIncidents", all.size());
        result.put("openIncidents", open);
        result.put(
                "estimatedWaterLossLiters",
                Math.round(estimatedLiters * 10.0) / 10.0
        );
        result.put(
                "dataNote",
                "Prototype values are based on received telemetry; "
                        + "simulated events must not be represented as "
                        + "real DJB measurements."
        );

        return result;
    }

    @Transactional
    public Map<String, Object> runDemoScenario(String scenario) {

        if (scenario == null
                || !(scenario.equalsIgnoreCase("normal")
                || scenario.equalsIgnoreCase("delivery")
                || scenario.equalsIgnoreCase("leak"))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Scenario must be normal, delivery, or leak"
            );
        }

        String normalizedScenario =
                scenario.toLowerCase(Locale.ROOT);

        long runNumber = demoRunCounter.incrementAndGet();

        /*
         * Each run receives a new synthetic identity.
         * This isolates demo telemetry from previous runs.
         */
        String tankerId = String.format(
                Locale.ROOT,
                "DJB-DEMO-%03d-R%03d",
                100 + ((runNumber - 1) % 900),
                runNumber % 1000
        );

        tankers.save(
                new Tanker(
                        tankerId,
                        "Demo Water Tanker " + runNumber,
                        DEMO_TANKER_CAPACITY_LITERS,
                        "Demo operator"
                )
        );

        Instant now = Instant.now();

        boolean delivery = normalizedScenario.equals("delivery");
        boolean valve = delivery;
        boolean moving = !delivery;

        double[] volumes;

        if (normalizedScenario.equals("normal")) {

            volumes = new double[] {
                    10000.0,
                    9990.0,
                    9980.0
            };

        } else if (normalizedScenario.equals("delivery")) {

            volumes = new double[] {
                    10000.0,
                    9700.0,
                    9400.0
            };

        } else {

            int leakIndex = (int) ((runNumber - 1)
                    % DEMO_LEAK_DROPS.length);

            double loss = DEMO_LEAK_DROPS[leakIndex];

            volumes = new double[] {
                    10000.0,
                    9990.0,
                    9990.0 - loss
            };
        }

        int locationIndex = (int) ((runNumber - 1)
                % DEMO_LOCATIONS.length);

        double startLatitude =
                DEMO_LOCATIONS[locationIndex][0];

        double startLongitude =
                DEMO_LOCATIONS[locationIndex][1];

        List<TelemetryResult> results = new ArrayList<>();

        for (int i = 0; i < volumes.length; i++) {

            double latitude = startLatitude + i * 0.0003;
            double longitude = startLongitude + i * 0.0004;

            TelemetryRequest event = new TelemetryRequest(
                    UUID.randomUUID().toString(),
                    tankerId,
                    now.plusSeconds(i * 60L),
                    volumes[i],
                    latitude,
                    longitude,
                    moving,
                    delivery,
                    valve,
                    valve ? 100.0 : 0.0,
                    "simulated-demo"
            );

            results.add(ingest(event));
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("scenario", normalizedScenario);
        response.put("simulated", true);
        response.put("tankerId", tankerId);
        response.put("events", results);
        response.put("dashboard", dashboard());

        return response;
    }
}