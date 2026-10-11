package com.kaamsafe.tanker.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "water_loss_incidents")
public class WaterLossIncident {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 80) private String tankerId;
    @Column(nullable = false) private Instant detectedAt;
    @Column(nullable = false) private double estimatedLossLiters;
    @Column(nullable = false) private double latitude;
    @Column(nullable = false) private double longitude;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IncidentSeverity severity;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private IncidentStatus status = IncidentStatus.OPEN;
    @Column(nullable = false, length = 500) private String reason;
    @Column(length = 1000) private String driverNote;
    @Column(nullable = false) private String dataSource;
    @Column(nullable = false) private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    protected WaterLossIncident() {}
    public WaterLossIncident(String tankerId, Instant detectedAt, double estimatedLossLiters, double latitude,
                             double longitude, IncidentSeverity severity, String reason, String dataSource) {
        this.tankerId = tankerId; this.detectedAt = detectedAt; this.estimatedLossLiters = estimatedLossLiters;
        this.latitude = latitude; this.longitude = longitude; this.severity = severity; this.reason = reason;
        this.dataSource = dataSource;
    }
    public Long getId() { return id; }
    public String getTankerId() { return tankerId; }
    public Instant getDetectedAt() { return detectedAt; }
    public double getEstimatedLossLiters() { return estimatedLossLiters; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public IncidentSeverity getSeverity() { return severity; }
    public IncidentStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getDriverNote() { return driverNote; }
    public String getDataSource() { return dataSource; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void updateStatus(IncidentStatus status, String note) {
    this.status = status;

    if (note != null && !note.isBlank()) {
        this.driverNote = note.trim();
        }

        this.updatedAt = Instant.now();
    }
}
