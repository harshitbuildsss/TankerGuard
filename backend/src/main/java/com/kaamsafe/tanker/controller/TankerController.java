package com.kaamsafe.tanker.controller;
import com.kaamsafe.tanker.dto.CreateTankerRequest;
import com.kaamsafe.tanker.model.Tanker;
import com.kaamsafe.tanker.service.WaterLossService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/tankers")
public class TankerController {
    private final WaterLossService service;
    public TankerController(WaterLossService service) { this.service = service; }
    @GetMapping public List<Tanker> all() { return service.listTankers(); }
    @GetMapping("/{id}") public Tanker one(@PathVariable String id) { return service.getTanker(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Tanker create(@Valid @RequestBody CreateTankerRequest request) { return service.createTanker(request); }
}
