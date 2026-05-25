package com.filestorage.controller;

import com.filestorage.dto.CreateDemoTenantRequest;
import com.filestorage.dto.CreateDemoTenantResponse;
import com.filestorage.dto.DemoTenantMetricsResponse;
import com.filestorage.dto.DemoTenantSummaryResponse;
import com.filestorage.service.MetricsService;
import com.filestorage.service.TenantService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo/tenants")
public class TenantController {

    private final TenantService tenantService;
    private final MetricsService metricsService;

    public TenantController(TenantService tenantService, MetricsService metricsService) {
        this.tenantService = tenantService;
        this.metricsService = metricsService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateDemoTenantResponse createDemoTenant(@RequestBody(required = false) CreateDemoTenantRequest request) {
        return tenantService.createDemoTenant(request);
    }

    @GetMapping
    public List<DemoTenantSummaryResponse> listDemoTenants() {
        return tenantService.listDemoTenants();
    }

    @GetMapping("/metrics")
    public List<DemoTenantMetricsResponse> listDemoTenantMetrics() {
        return metricsService.listAllTenantMetrics();
    }
}
