package com.filestorage.dto;

import java.util.UUID;

public record MetricsResponse(
        UUID tenantId,
        String tenantName,
        Long totalFiles,
        Long totalBytes,
        String totalBytesHuman,
        String provider
) {
}
