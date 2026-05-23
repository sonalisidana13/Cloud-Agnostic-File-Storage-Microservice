package com.filestorage.provider;

public interface StorageProvider {

    String generatePresignedUploadUrl(String fileKey, long expiresInSeconds);

    String generatePresignedDownloadUrl(String fileKey, long expiresInSeconds);

    boolean exists(String fileKey);

    void delete(String fileKey);

    String getProviderName();
}
