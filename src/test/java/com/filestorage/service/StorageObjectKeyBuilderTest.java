package com.filestorage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class StorageObjectKeyBuilderTest {

    private final StorageObjectKeyBuilder builder = new StorageObjectKeyBuilder();

    @Test
    void buildsTenantFirstKeyForNormalFilename() {
        UUID tenantId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();

        String key = builder.buildTenantFileKey(tenantId, fileId, "report.pdf");

        assertEquals(
                "tenants/" + tenantId + "/files/" + fileId + "/report.pdf",
                key
        );
    }

    @Test
    void sanitizesWhitespaceSeparatorsAndNoisyCharacters() {
        String sanitized = builder.sanitizeFilename("  quarter report / final \\\\ v2 @2024 .pdf  ");

        assertEquals("quarter-report-final-v2-2024.pdf", sanitized);
        assertTrue(!sanitized.contains("/"));
        assertTrue(!sanitized.contains("\\"));
    }

    @Test
    void preservesMixedCaseAndUppercaseExtension() {
        String sanitized = builder.sanitizeFilename("My File.V1.PNG");

        assertEquals("My-File.V1.PNG", sanitized);
    }

    @Test
    void fallsBackToDefaultBaseNameWhenNothingSafeRemains() {
        String sanitized = builder.sanitizeFilename("  !!! .json ");

        assertEquals("file.json", sanitized);
    }
}
