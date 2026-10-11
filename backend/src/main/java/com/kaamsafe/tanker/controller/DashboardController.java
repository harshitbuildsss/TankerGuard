package com.kaamsafe.tanker.controller;
import com.kaamsafe.tanker.service.WaterLossService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final WaterLossService service;
    public DashboardController(WaterLossService service) { this.service = service; }
    @GetMapping("/summary") public Map<String, Object> summary() { return service.dashboard(); }
}
