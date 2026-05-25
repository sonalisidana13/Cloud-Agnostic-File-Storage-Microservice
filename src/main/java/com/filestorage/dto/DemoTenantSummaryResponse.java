package com.filestorage.dto;

import java.time.Instant;
import java.util.UUID;

public record DemoTenantSummaryResponse(
        UUID tenantId,
        String tenantName,
        String apiKey,
        Instant createdAt
) {
}
