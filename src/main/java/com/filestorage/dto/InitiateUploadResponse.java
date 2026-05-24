package com.filestorage.dto;

import java.time.Instant;
import java.util.UUID;

public record InitiateUploadResponse(
        UUID fileId,
        String uploadUrl,
        Instant expiresAt
) {
}
