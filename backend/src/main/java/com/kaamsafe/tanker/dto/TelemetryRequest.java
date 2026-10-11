package com.kaamsafe.tanker.dto;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record TelemetryRequest(@NotBlank String eventId, @NotBlank String tankerId, Instant recordedAt,
                               @PositiveOrZero double waterVolumeLiters,
                               @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
                               @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
                               boolean moving, boolean deliveryAuthorized, boolean valveOpen,
                               @PositiveOrZero double outletFlowLitersPerMinute,
                               String source) {}
