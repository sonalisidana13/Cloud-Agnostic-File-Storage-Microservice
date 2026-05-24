package com.filestorage.dto;

import java.time.Instant;
import java.util.UUID;

public record FileMetadataResponse(
        UUID fileId,
        String fileName,
        String contentType,
        Long sizeBytes,
        Instant uploadedAt,
        String downloadUrl
) {
}
