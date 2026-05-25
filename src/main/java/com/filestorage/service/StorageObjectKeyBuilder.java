package com.filestorage.service;

import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class StorageObjectKeyBuilder {

    private static final Pattern PATH_SEPARATORS = Pattern.compile("[/\\\\]+");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern UNSAFE_KEY_CHARACTERS = Pattern.compile("[^A-Za-z0-9._-]+");
    private static final Pattern REPEATED_DASHES = Pattern.compile("-{2,}");
    private static final Pattern LEADING_OR_TRAILING_PUNCTUATION = Pattern.compile("^[._-]+|[._-]+$");
    private static final Pattern EXTENSION_UNSAFE_CHARACTERS = Pattern.compile("[^A-Za-z0-9]+");

    public String buildTenantFileKey(UUID tenantId, UUID fileId, String originalFilename) {
        return "tenants/" + tenantId + "/files/" + fileId + "/" + sanitizeFilename(originalFilename);
    }

    String sanitizeFilename(String originalFilename) {
        String trimmedFilename = originalFilename == null ? "" : originalFilename.trim();
        int extensionIndex = trimmedFilename.lastIndexOf('.');
        boolean hasExtension = extensionIndex > 0 && extensionIndex < trimmedFilename.length() - 1;

        String baseName = hasExtension
                ? trimmedFilename.substring(0, extensionIndex)
                : trimmedFilename;
        String extension = hasExtension
                ? trimmedFilename.substring(extensionIndex + 1)
                : "";

        String sanitizedBaseName = sanitizeBaseName(baseName);
        if (sanitizedBaseName.isBlank()) {
            sanitizedBaseName = "file";
        }

        String sanitizedExtension = sanitizeExtension(extension);
        if (!sanitizedExtension.isBlank()) {
            return sanitizedBaseName + "." + sanitizedExtension;
        }

        return sanitizedBaseName;
    }

    private String sanitizeBaseName(String value) {
        String sanitized = PATH_SEPARATORS.matcher(value).replaceAll("-");
        sanitized = WHITESPACE.matcher(sanitized).replaceAll("-");
        sanitized = UNSAFE_KEY_CHARACTERS.matcher(sanitized).replaceAll("-");
        sanitized = REPEATED_DASHES.matcher(sanitized).replaceAll("-");
        return LEADING_OR_TRAILING_PUNCTUATION.matcher(sanitized).replaceAll("");
    }

    private String sanitizeExtension(String value) {
        return EXTENSION_UNSAFE_CHARACTERS.matcher(value).replaceAll("");
    }
}
