package com.filestorage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.filestorage.dto.DemoTenantMetricsResponse;
import com.filestorage.model.Tenant;
import com.filestorage.model.TenantMetrics;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.TenantMetricsRepository;
import com.filestorage.repository.TenantRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MetricsServiceTest {

    @Mock
    private TenantMetricsRepository tenantMetricsRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private StorageProvider storageProvider;

    @Test
    void listAllTenantMetricsReturnsZeroedMetricsWhenMissing() {
        MetricsService metricsService = new MetricsService(
                tenantMetricsRepository,
                tenantRepository,
                storageProvider
        );
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("alpha");
        tenant.setCreatedAt(LocalDateTime.of(2026, 5, 25, 9, 0));

        when(tenantRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(tenant));
        when(tenantMetricsRepository.findAll()).thenReturn(List.of());
        when(storageProvider.getProviderName()).thenReturn("cloudflare-r2");

        List<DemoTenantMetricsResponse> response = metricsService.listAllTenantMetrics();

        assertEquals(1, response.size());
        assertEquals(0L, response.get(0).totalFiles());
        assertEquals(0L, response.get(0).totalBytes());
        assertEquals("0 B", response.get(0).totalBytesHuman());
        assertEquals("cloudflare-r2", response.get(0).provider());
        assertEquals(tenant.getCreatedAt().toInstant(ZoneOffset.UTC), response.get(0).createdAt());
    }

    @Test
    void listAllTenantMetricsReturnsStoredTotals() {
        MetricsService metricsService = new MetricsService(
                tenantMetricsRepository,
                tenantRepository,
                storageProvider
        );
        UUID tenantId = UUID.randomUUID();

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("beta");

        TenantMetrics metrics = new TenantMetrics();
        metrics.setTenantId(tenantId);
        metrics.setTotalFiles(3L);
        metrics.setTotalBytes(2048L);

        when(tenantRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(tenant));
        when(tenantMetricsRepository.findAll()).thenReturn(List.of(metrics));
        when(storageProvider.getProviderName()).thenReturn("cloudflare-r2");

        List<DemoTenantMetricsResponse> response = metricsService.listAllTenantMetrics();

        assertEquals(1, response.size());
        assertEquals(3L, response.get(0).totalFiles());
        assertEquals(2048L, response.get(0).totalBytes());
        assertEquals("2.0 KB", response.get(0).totalBytesHuman());
    }
}
