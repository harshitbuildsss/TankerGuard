package com.kaamsafe.tanker.dto;
import com.kaamsafe.tanker.model.IncidentStatus;
import jakarta.validation.constraints.NotNull;
public record IncidentStatusRequest(@NotNull IncidentStatus status, String note) {}
