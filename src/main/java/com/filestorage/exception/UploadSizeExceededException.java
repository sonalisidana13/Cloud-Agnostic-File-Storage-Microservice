package com.filestorage.exception;

public class UploadSizeExceededException extends RuntimeException {

    public UploadSizeExceededException(String message) {
        super(message);
    }
}
