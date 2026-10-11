package com.kaamsafe.tanker.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry_events", indexes = {
        @Index(name = "idx_telemetry_tanker_time", columnList = "tankerId,recordedAt")
})
public class TelemetryEvent {
    @Id @Column(length = 80) private String eventId;
    @Column(nullable = false, length = 80) private String tankerId;
    @Column(nullable = false) private Instant recordedAt;
    @Column(nullable = false) private double waterVolumeLiters;
    @Column(nullable = false) private double latitude;
    @Column(nullable = false) private double longitude;
    @Column(nullable = false) private boolean moving;
    @Column(nullable = false) private boolean deliveryAuthorized;
    @Column(nullable = false) private boolean valveOpen;
    @Column(nullable = false) private double outletFlowLitersPerMinute;
    @Column(nullable = false) private String source;

    protected TelemetryEvent() {}
    public TelemetryEvent(String eventId, String tankerId, Instant recordedAt, double waterVolumeLiters,
                          double latitude, double longitude, boolean moving, boolean deliveryAuthorized,
                          boolean valveOpen, double outletFlowLitersPerMinute, String source) {
        this.eventId = eventId; this.tankerId = tankerId; this.recordedAt = recordedAt;
        this.waterVolumeLiters = waterVolumeLiters; this.latitude = latitude; this.longitude = longitude;
        this.moving = moving; this.deliveryAuthorized = deliveryAuthorized; this.valveOpen = valveOpen;
        this.outletFlowLitersPerMinute = outletFlowLitersPerMinute; this.source = source;
    }
    public String getEventId() { return eventId; }
    public String getTankerId() { return tankerId; }
    public Instant getRecordedAt() { return recordedAt; }
    public double getWaterVolumeLiters() { return waterVolumeLiters; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public boolean isMoving() { return moving; }
    public boolean isDeliveryAuthorized() { return deliveryAuthorized; }
    public boolean isValveOpen() { return valveOpen; }
    public double getOutletFlowLitersPerMinute() { return outletFlowLitersPerMinute; }
    public String getSource() { return source; }
}
