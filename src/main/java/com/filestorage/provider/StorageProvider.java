package com.filestorage.provider;

import java.io.InputStream;

public interface StorageProvider {

    String generatePresignedUploadUrl(String fileKey, long expiresInSeconds);

    String generatePresignedDownloadUrl(String fileKey, long expiresInSeconds);

    void upload(String fileKey, String contentType, InputStream inputStream, long sizeBytes);

    boolean exists(String fileKey);

    void delete(String fileKey);

    String getProviderName();
}
