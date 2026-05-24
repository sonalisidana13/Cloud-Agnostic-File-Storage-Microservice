package com.filestorage.service;

import com.filestorage.dto.InitiateUploadRequest;
import com.filestorage.dto.InitiateUploadResponse;
import com.filestorage.exception.FileNotFoundException;
import com.filestorage.exception.StorageException;
import com.filestorage.model.StoredFile;
import com.filestorage.model.Tenant;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.StoredFileRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FileService {

    private static final long UPLOAD_URL_EXPIRY_SECONDS = 900;
    private static final String PENDING_STATUS = "PENDING";
    private static final String UPLOADED_STATUS = "UPLOADED";

    private final StoredFileRepository storedFileRepository;
    private final StorageProvider storageProvider;

    public FileService(StoredFileRepository storedFileRepository, StorageProvider storageProvider) {
        this.storedFileRepository = storedFileRepository;
        this.storageProvider = storageProvider;
    }

    @Transactional
    public InitiateUploadResponse initiateUpload(Tenant tenant, InitiateUploadRequest request) {
        UUID fileId = UUID.randomUUID();
        String fileKey = tenant.getId() + "/" + fileId + "/" + request.fileName();

        StoredFile storedFile = new StoredFile();
        storedFile.setId(fileId);
        storedFile.setTenantId(tenant.getId());
        storedFile.setFileKey(fileKey);
        storedFile.setOriginalName(request.fileName());
        storedFile.setContentType(request.contentType());
        storedFile.setSizeBytes(request.sizeBytes());
        storedFile.setStatus(PENDING_STATUS);
        storedFile.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        storedFileRepository.save(storedFile);

        String uploadUrl = storageProvider.generatePresignedUploadUrl(fileKey, UPLOAD_URL_EXPIRY_SECONDS);
        Instant expiresAt = Instant.now().plusSeconds(UPLOAD_URL_EXPIRY_SECONDS);
        return new InitiateUploadResponse(fileId, uploadUrl, expiresAt);
    }

    @Transactional
    public void completeUpload(Tenant tenant, UUID fileId) {
        StoredFile storedFile = storedFileRepository.findByIdAndTenantId(fileId, tenant.getId())
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        if (!storageProvider.exists(storedFile.getFileKey())) {
            throw new StorageException(
                    "File not found in storage — upload may have failed",
                    storageProvider.getProviderName()
            );
        }

        storedFile.setStatus(UPLOADED_STATUS);
        storedFile.setUploadedAt(LocalDateTime.now(ZoneOffset.UTC));
        storedFileRepository.save(storedFile);
    }
}
