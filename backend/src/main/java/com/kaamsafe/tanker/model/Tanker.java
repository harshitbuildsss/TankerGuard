package com.kaamsafe.tanker.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "tankers")
public class Tanker {
    @Id @Column(length = 80)
    private String tankerId;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private double capacityLiters;
    @Column(nullable = false) private String operatorName;
    @Column(nullable = false) private boolean active = true;
    @Column(nullable = false) private Instant createdAt = Instant.now();

    protected Tanker() {}
    public Tanker(String tankerId, String name, double capacityLiters, String operatorName) {
        this.tankerId = tankerId; this.name = name; this.capacityLiters = capacityLiters; this.operatorName = operatorName;
    }
    public String getTankerId() { return tankerId; }
    public String getName() { return name; }
    public double getCapacityLiters() { return capacityLiters; }
    public String getOperatorName() { return operatorName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
}
