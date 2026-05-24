package com.filestorage.service;

import com.filestorage.dto.FileMetadataResponse;
import com.filestorage.dto.InitiateUploadRequest;
import com.filestorage.dto.InitiateUploadResponse;
import com.filestorage.exception.FileNotFoundException;
import com.filestorage.exception.StorageException;
import com.filestorage.model.StoredFile;
import com.filestorage.model.Tenant;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.StoredFileRepository;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    private static final long UPLOAD_URL_EXPIRY_SECONDS = 900;
    private static final long DOWNLOAD_URL_EXPIRY_SECONDS = 3600;
    private static final String PENDING_STATUS = "PENDING";
    private static final String UPLOADED_STATUS = "UPLOADED";
    private static final String DELETED_STATUS = "DELETED";

    private final StoredFileRepository storedFileRepository;
    private final MetricsService metricsService;
    private final StorageProvider storageProvider;

    public FileService(
            StoredFileRepository storedFileRepository,
            MetricsService metricsService,
            StorageProvider storageProvider
    ) {
        this.storedFileRepository = storedFileRepository;
        this.metricsService = metricsService;
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

        if (UPLOADED_STATUS.equals(storedFile.getStatus())) {
            return;
        }

        if (!storageProvider.exists(storedFile.getFileKey())) {
            throw new StorageException(
                    "File not found in storage — upload may have failed",
                    storageProvider.getProviderName()
            );
        }

        storedFile.setStatus(UPLOADED_STATUS);
        storedFile.setUploadedAt(LocalDateTime.now(ZoneOffset.UTC));
        storedFileRepository.save(storedFile);
        metricsService.updateMetrics(tenant.getId(), 1L, defaultToZero(storedFile.getSizeBytes()));
    }

    @Transactional
    public void uploadPendingFile(Tenant tenant, UUID fileId, MultipartFile file) {
        StoredFile storedFile = storedFileRepository.findByIdAndTenantId(fileId, tenant.getId())
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        if (UPLOADED_STATUS.equals(storedFile.getStatus())) {
            return;
        }

        String contentType = file.getContentType() == null || file.getContentType().isBlank()
                ? storedFile.getContentType()
                : file.getContentType();

        storedFile.setOriginalName(file.getOriginalFilename());
        storedFile.setContentType(contentType);
        storedFile.setSizeBytes(file.getSize());

        try {
            storageProvider.upload(
                    storedFile.getFileKey(),
                    contentType,
                    file.getInputStream(),
                    file.getSize()
            );
        } catch (IOException exception) {
            throw new StorageException("Failed to read upload stream", storageProvider.getProviderName());
        } catch (RuntimeException exception) {
            throw new StorageException("Upload to storage failed", storageProvider.getProviderName());
        }

        storedFile.setStatus(UPLOADED_STATUS);
        storedFile.setUploadedAt(LocalDateTime.now(ZoneOffset.UTC));
        storedFileRepository.save(storedFile);
        metricsService.updateMetrics(tenant.getId(), 1L, defaultToZero(storedFile.getSizeBytes()));
    }

    @Transactional(readOnly = true)
    public List<FileMetadataResponse> listFiles(Tenant tenant) {
        return storedFileRepository.findByTenantIdAndStatus(tenant.getId(), UPLOADED_STATUS).stream()
                .map(this::toFileMetadataResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(Tenant tenant, UUID fileId) {
        StoredFile storedFile = storedFileRepository.findByIdAndTenantId(fileId, tenant.getId())
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        // R2 charges $0 egress — presigned URLs served directly from R2 edge
        return storageProvider.generatePresignedDownloadUrl(storedFile.getFileKey(), DOWNLOAD_URL_EXPIRY_SECONDS);
    }

    @Transactional
    public void deleteFile(Tenant tenant, UUID fileId) {
        StoredFile storedFile = storedFileRepository.findByIdAndTenantId(fileId, tenant.getId())
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        if (DELETED_STATUS.equals(storedFile.getStatus())) {
            return;
        }

        boolean decrementMetrics = UPLOADED_STATUS.equals(storedFile.getStatus());
        storageProvider.delete(storedFile.getFileKey());
        storedFile.setStatus(DELETED_STATUS);
        storedFileRepository.save(storedFile);

        if (decrementMetrics) {
            metricsService.updateMetrics(tenant.getId(), -1L, -defaultToZero(storedFile.getSizeBytes()));
        }
    }

    private long defaultToZero(Long value) {
        return value == null ? 0L : value;
    }

    private FileMetadataResponse toFileMetadataResponse(StoredFile storedFile) {
        // R2 charges $0 egress — presigned URLs served directly from R2 edge
        String downloadUrl = storageProvider.generatePresignedDownloadUrl(
                storedFile.getFileKey(),
                DOWNLOAD_URL_EXPIRY_SECONDS
        );

        Instant uploadedAt = storedFile.getUploadedAt() == null
                ? null
                : storedFile.getUploadedAt().toInstant(ZoneOffset.UTC);

        return new FileMetadataResponse(
                storedFile.getId(),
                storedFile.getOriginalName(),
                storedFile.getContentType(),
                storedFile.getSizeBytes(),
                uploadedAt,
                downloadUrl
        );
    }
}
