package com.filestorage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InitiateUploadRequest(
        @NotBlank String fileName,
        @NotBlank String contentType,
        @NotNull Long sizeBytes
) {
}
