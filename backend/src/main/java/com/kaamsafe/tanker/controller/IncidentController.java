package com.kaamsafe.tanker.controller;
import com.kaamsafe.tanker.dto.IncidentStatusRequest;
import com.kaamsafe.tanker.model.IncidentStatus;
import com.kaamsafe.tanker.model.WaterLossIncident;
import com.kaamsafe.tanker.service.WaterLossService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/incidents")
public class IncidentController {
    private final WaterLossService service;
    public IncidentController(WaterLossService service) { this.service = service; }
    @GetMapping public List<WaterLossIncident> all(@RequestParam(required = false) IncidentStatus status) { return service.allIncidents(status); }
    @GetMapping("/tanker/{tankerId}") public List<WaterLossIncident> forTanker(@PathVariable String tankerId) { return service.incidentsForTanker(tankerId); }
    @PatchMapping("/{id}/status") public WaterLossIncident update(@PathVariable Long id, @Valid @RequestBody IncidentStatusRequest request) { return service.updateIncident(id, request); }
}
