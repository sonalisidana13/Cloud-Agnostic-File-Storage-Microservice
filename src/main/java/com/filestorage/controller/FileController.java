package com.filestorage.controller;

import com.filestorage.dto.FileMetadataResponse;
import com.filestorage.dto.InitiateUploadRequest;
import com.filestorage.dto.InitiateUploadResponse;
import com.filestorage.model.Tenant;
import com.filestorage.service.FileService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping
    public List<FileMetadataResponse> listFiles(@AuthenticationPrincipal Tenant tenant) {
        return fileService.listFiles(tenant);
    }

    @PostMapping("/initiate")
    public InitiateUploadResponse initiateUpload(
            @AuthenticationPrincipal Tenant tenant,
            @Valid @RequestBody InitiateUploadRequest request
    ) {
        return fileService.initiateUpload(tenant, request);
    }

    @GetMapping("/{fileId}/download-url")
    public Map<String, String> getDownloadUrl(
            @AuthenticationPrincipal Tenant tenant,
            @PathVariable UUID fileId
    ) {
        return Map.of("downloadUrl", fileService.getDownloadUrl(tenant, fileId));
    }

    @PostMapping("/{fileId}/complete")
    public ResponseEntity<Void> completeUpload(
            @AuthenticationPrincipal Tenant tenant,
            @PathVariable UUID fileId
    ) {
        fileService.completeUpload(tenant, fileId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{fileId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadThroughBackend(
            @AuthenticationPrincipal Tenant tenant,
            @PathVariable UUID fileId,
            @RequestPart("file") MultipartFile file
    ) {
        fileService.uploadPendingFile(tenant, fileId, file);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @AuthenticationPrincipal Tenant tenant,
            @PathVariable UUID fileId
    ) {
        fileService.deleteFile(tenant, fileId);
        return ResponseEntity.noContent().build();
    }
}
