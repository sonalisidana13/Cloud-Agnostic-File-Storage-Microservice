package com.filestorage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.filestorage.dto.InitiateUploadRequest;
import com.filestorage.dto.InitiateUploadResponse;
import com.filestorage.model.StoredFile;
import com.filestorage.model.Tenant;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.StoredFileRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private StoredFileRepository storedFileRepository;

    @Mock
    private MetricsService metricsService;

    @Mock
    private StorageProvider storageProvider;

    private final StorageObjectKeyBuilder storageObjectKeyBuilder = new StorageObjectKeyBuilder();

    @Captor
    private ArgumentCaptor<StoredFile> storedFileCaptor;

    @Test
    void initiateUploadStoresTenantFirstFileKey() {
        FileService fileService = new FileService(
                storedFileRepository,
                metricsService,
                storageProvider,
                storageObjectKeyBuilder
        );
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());

        when(storageProvider.generatePresignedUploadUrl(any(), eq("application/pdf"), eq(900L)))
                .thenReturn("https://upload.example.com");

        InitiateUploadResponse response = fileService.initiateUpload(
                tenant,
                new InitiateUploadRequest("Quarterly Report.pdf", "application/pdf", 1024L)
        );

        verify(storedFileRepository).save(storedFileCaptor.capture());
        StoredFile storedFile = storedFileCaptor.getValue();

        assertEquals(response.fileId(), storedFile.getId());
        assertEquals(
                "tenants/" + tenant.getId() + "/files/" + storedFile.getId() + "/Quarterly-Report.pdf",
                storedFile.getFileKey()
        );
        assertTrue(storedFile.getFileKey().startsWith("tenants/" + tenant.getId() + "/files/"));
    }

    @Test
    void getDownloadUrlUsesPersistedFileKey() {
        FileService fileService = new FileService(
                storedFileRepository,
                metricsService,
                storageProvider,
                storageObjectKeyBuilder
        );
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        UUID fileId = UUID.randomUUID();

        StoredFile storedFile = new StoredFile();
        storedFile.setId(fileId);
        storedFile.setTenantId(tenant.getId());
        storedFile.setFileKey("tenants/" + tenant.getId() + "/files/" + fileId + "/report.pdf");

        when(storedFileRepository.findByIdAndTenantId(fileId, tenant.getId()))
                .thenReturn(Optional.of(storedFile));
        when(storageProvider.generatePresignedDownloadUrl(storedFile.getFileKey(), 3600L))
                .thenReturn("https://download.example.com");

        String downloadUrl = fileService.getDownloadUrl(tenant, fileId);

        assertEquals("https://download.example.com", downloadUrl);
        verify(storageProvider).generatePresignedDownloadUrl(storedFile.getFileKey(), 3600L);
    }

    @Test
    void deleteFileUsesPersistedFileKey() {
        FileService fileService = new FileService(
                storedFileRepository,
                metricsService,
                storageProvider,
                storageObjectKeyBuilder
        );
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        UUID fileId = UUID.randomUUID();

        StoredFile storedFile = new StoredFile();
        storedFile.setId(fileId);
        storedFile.setTenantId(tenant.getId());
        storedFile.setFileKey("tenants/" + tenant.getId() + "/files/" + fileId + "/report.pdf");
        storedFile.setStatus("UPLOADED");
        storedFile.setSizeBytes(512L);

        when(storedFileRepository.findByIdAndTenantId(fileId, tenant.getId()))
                .thenReturn(Optional.of(storedFile));

        fileService.deleteFile(tenant, fileId);

        verify(storageProvider).delete(storedFile.getFileKey());
        verify(metricsService).updateMetrics(tenant.getId(), -1L, -512L);
    }
}
