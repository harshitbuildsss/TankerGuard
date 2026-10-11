package com.kaamsafe.tanker.dto;
import jakarta.validation.constraints.*;
public record CreateTankerRequest(@NotBlank String tankerId, @NotBlank String name,
                                  @Positive double capacityLiters, @NotBlank String operatorName) {}
