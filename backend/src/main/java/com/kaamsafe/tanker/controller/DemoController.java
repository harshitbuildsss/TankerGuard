package com.kaamsafe.tanker.controller;
import com.kaamsafe.tanker.service.WaterLossService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/demo")
public class DemoController {
    private final WaterLossService service;
    public DemoController(WaterLossService service) { this.service = service; }
    @PostMapping("/scenario/{scenario}") public Map<String, Object> scenario(@PathVariable String scenario) { return service.runDemoScenario(scenario); }
}
