package com.kaamsafe.tanker.controller;
import com.kaamsafe.tanker.dto.TelemetryRequest;
import com.kaamsafe.tanker.dto.TelemetryResult;
import com.kaamsafe.tanker.model.TelemetryEvent;
import com.kaamsafe.tanker.service.WaterLossService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {
    private final WaterLossService service;
    public TelemetryController(WaterLossService service) { this.service = service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public TelemetryResult ingest(@Valid @RequestBody TelemetryRequest request) { return service.ingest(request); }
    @GetMapping("/{tankerId}") public List<TelemetryEvent> forTanker(@PathVariable String tankerId) { return service.telemetryFor(tankerId); }
}
