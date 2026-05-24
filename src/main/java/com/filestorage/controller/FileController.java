package com.filestorage.controller;

import com.filestorage.dto.InitiateUploadRequest;
import com.filestorage.dto.InitiateUploadResponse;
import com.filestorage.model.Tenant;
import com.filestorage.service.FileService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/initiate")
    public InitiateUploadResponse initiateUpload(
            @AuthenticationPrincipal Tenant tenant,
            @Valid @RequestBody InitiateUploadRequest request
    ) {
        return fileService.initiateUpload(tenant, request);
    }

    @PostMapping("/{fileId}/complete")
    public ResponseEntity<Void> completeUpload(
            @AuthenticationPrincipal Tenant tenant,
            @PathVariable UUID fileId
    ) {
        fileService.completeUpload(tenant, fileId);
        return ResponseEntity.noContent().build();
    }
}
