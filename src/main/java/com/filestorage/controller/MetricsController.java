package com.filestorage.controller;

import com.filestorage.dto.MetricsResponse;
import com.filestorage.model.Tenant;
import com.filestorage.service.MetricsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping
    public MetricsResponse getMetrics(@AuthenticationPrincipal Tenant tenant) {
        return metricsService.getMetrics(tenant);
    }
}
