package com.filestorage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.filestorage.dto.CreateDemoTenantRequest;
import com.filestorage.dto.CreateDemoTenantResponse;
import com.filestorage.dto.DemoTenantSummaryResponse;
import com.filestorage.model.Tenant;
import com.filestorage.repository.TenantRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Captor
    private ArgumentCaptor<Tenant> tenantCaptor;

    @Test
    void createDemoTenantReturnsApiKeyAndPersistsTenant() {
        TenantService tenantService = new TenantService(tenantRepository);

        CreateDemoTenantResponse response = tenantService.createDemoTenant(new CreateDemoTenantRequest("alpha"));

        verify(tenantRepository).save(tenantCaptor.capture());
        Tenant savedTenant = tenantCaptor.getValue();

        assertEquals("alpha", savedTenant.getName());
        assertEquals(savedTenant.getId(), response.tenantId());
        assertEquals(savedTenant.getName(), response.tenantName());
        assertEquals(savedTenant.getApiKey(), response.apiKey());
        assertNotNull(response.createdAt());
        assertTrue(response.apiKey().startsWith("demo_"));
    }

    @Test
    void listDemoTenantsReturnsTenantDetailsForSwitcher() {
        TenantService tenantService = new TenantService(tenantRepository);
        Tenant newestTenant = new Tenant();
        newestTenant.setId(UUID.randomUUID());
        newestTenant.setName("beta");
        newestTenant.setApiKey("demo_beta");
        newestTenant.setCreatedAt(LocalDateTime.of(2026, 5, 25, 12, 0));

        when(tenantRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(newestTenant));

        List<DemoTenantSummaryResponse> tenants = tenantService.listDemoTenants();

        assertEquals(1, tenants.size());
        assertEquals(newestTenant.getId(), tenants.get(0).tenantId());
        assertEquals("beta", tenants.get(0).tenantName());
        assertEquals("demo_beta", tenants.get(0).apiKey());
        assertEquals(newestTenant.getCreatedAt().toInstant(ZoneOffset.UTC), tenants.get(0).createdAt());
    }
}
