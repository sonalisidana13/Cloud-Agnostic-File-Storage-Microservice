package com.filestorage.service;

import com.filestorage.dto.CreateDemoTenantRequest;
import com.filestorage.dto.CreateDemoTenantResponse;
import com.filestorage.model.Tenant;
import com.filestorage.repository.TenantRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private static final String DEMO_TENANT_PREFIX = "Demo Tenant";
    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    public CreateDemoTenantResponse createDemoTenant(CreateDemoTenantRequest request) {
        LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName(resolveTenantName(request));
        tenant.setApiKey("demo_" + UUID.randomUUID() + UUID.randomUUID().toString().substring(0, 8));
        tenant.setCreatedAt(createdAt);

        tenantRepository.save(tenant);

        return new CreateDemoTenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getApiKey(),
                createdAt.toInstant(ZoneOffset.UTC)
        );
    }

    private String resolveTenantName(CreateDemoTenantRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            return DEMO_TENANT_PREFIX + " " + Instant.now().getEpochSecond();
        }

        return request.name().trim();
    }
}
