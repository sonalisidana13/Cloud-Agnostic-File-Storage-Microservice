package com.filestorage.dto;

import java.time.Instant;
import java.util.UUID;

public record CreateDemoTenantResponse(
        UUID tenantId,
        String tenantName,
        String apiKey,
        Instant createdAt
) {
}
