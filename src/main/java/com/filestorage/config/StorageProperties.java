package com.filestorage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String provider,
        String bucketName,
        String accountId,
        String region,
        String accessKey,
        String secretKey
) {
}
