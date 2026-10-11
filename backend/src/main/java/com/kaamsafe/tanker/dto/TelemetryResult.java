package com.kaamsafe.tanker.dto;
public record TelemetryResult(String eventId, boolean duplicate, boolean anomalyDetected, Long incidentId,
                              Double estimatedLossLiters, String message) {}
