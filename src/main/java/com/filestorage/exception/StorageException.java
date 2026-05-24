package com.filestorage.exception;

public class StorageException extends RuntimeException {

    private final String provider;

    public StorageException(String message, String provider) {
        super(message);
        this.provider = provider;
    }

    public String getProvider() {
        return provider;
    }
}
