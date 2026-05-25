package com.filestorage.service;

import com.filestorage.dto.DemoTenantMetricsResponse;
import com.filestorage.dto.MetricsResponse;
import com.filestorage.model.Tenant;
import com.filestorage.model.TenantMetrics;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.TenantRepository;
import com.filestorage.repository.TenantMetricsRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MetricsService {

    private static final String[] SIZE_UNITS = {"B", "KB", "MB", "GB", "TB", "PB"};
    private static final long UNIT_SIZE = 1024L;

    private final TenantMetricsRepository tenantMetricsRepository;
    private final TenantRepository tenantRepository;
    private final StorageProvider storageProvider;

    public MetricsService(
            TenantMetricsRepository tenantMetricsRepository,
            TenantRepository tenantRepository,
            StorageProvider storageProvider
    ) {
        this.tenantMetricsRepository = tenantMetricsRepository;
        this.tenantRepository = tenantRepository;
        this.storageProvider = storageProvider;
    }

    @Transactional
    public void updateMetrics(UUID tenantId, long fileDelta, long bytesDelta) {
        TenantMetrics tenantMetrics = tenantMetricsRepository.findById(tenantId)
                .orElseGet(() -> createDefaultMetrics(tenantId));

        tenantMetrics.setTotalFiles(defaultToZero(tenantMetrics.getTotalFiles()) + fileDelta);
        tenantMetrics.setTotalBytes(defaultToZero(tenantMetrics.getTotalBytes()) + bytesDelta);
        tenantMetrics.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        tenantMetricsRepository.save(tenantMetrics);
    }

    @Transactional(readOnly = true)
    public MetricsResponse getMetrics(Tenant tenant) {
        TenantMetrics tenantMetrics = tenantMetricsRepository.findById(tenant.getId())
                .orElseGet(() -> createDefaultMetrics(tenant.getId()));

        long totalFiles = defaultToZero(tenantMetrics.getTotalFiles());
        long totalBytes = defaultToZero(tenantMetrics.getTotalBytes());

        return new MetricsResponse(
                tenant.getId(),
                tenant.getName(),
                totalFiles,
                totalBytes,
                toHumanReadableSize(totalBytes),
                storageProvider.getProviderName()
        );
    }

    @Transactional(readOnly = true)
    public List<DemoTenantMetricsResponse> listAllTenantMetrics() {
        List<Tenant> tenants = tenantRepository.findAllByOrderByCreatedAtDesc();
        Map<UUID, TenantMetrics> metricsByTenantId = tenantMetricsRepository.findAll().stream()
                .collect(Collectors.toMap(TenantMetrics::getTenantId, Function.identity()));

        return tenants.stream()
                .map(tenant -> toDemoTenantMetricsResponse(
                        tenant,
                        metricsByTenantId.getOrDefault(tenant.getId(), createDefaultMetrics(tenant.getId()))
                ))
                .toList();
    }

    private TenantMetrics createDefaultMetrics(UUID tenantId) {
        TenantMetrics tenantMetrics = new TenantMetrics();
        tenantMetrics.setTenantId(tenantId);
        tenantMetrics.setTotalFiles(0L);
        tenantMetrics.setTotalBytes(0L);
        return tenantMetrics;
    }

    private long defaultToZero(Long value) {
        return value == null ? 0L : value;
    }

    private DemoTenantMetricsResponse toDemoTenantMetricsResponse(Tenant tenant, TenantMetrics tenantMetrics) {
        long totalFiles = defaultToZero(tenantMetrics.getTotalFiles());
        long totalBytes = defaultToZero(tenantMetrics.getTotalBytes());

        return new DemoTenantMetricsResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getCreatedAt() == null ? null : tenant.getCreatedAt().toInstant(ZoneOffset.UTC),
                totalFiles,
                totalBytes,
                toHumanReadableSize(totalBytes),
                storageProvider.getProviderName()
        );
    }

    private String toHumanReadableSize(long bytes) {
        if (bytes < UNIT_SIZE) {
            return bytes + " B";
        }

        double value = bytes;
        int unitIndex = 0;
        while (value >= UNIT_SIZE && unitIndex < SIZE_UNITS.length - 1) {
            value /= UNIT_SIZE;
            unitIndex++;
        }

        return "%.1f %s".formatted(value, SIZE_UNITS[unitIndex]);
    }
}
