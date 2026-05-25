package com.filestorage.dto;

import java.time.Instant;
import java.util.UUID;

public record DemoTenantMetricsResponse(
        UUID tenantId,
        String tenantName,
        Instant createdAt,
        Long totalFiles,
        Long totalBytes,
        String totalBytesHuman,
        String provider
) {
}
