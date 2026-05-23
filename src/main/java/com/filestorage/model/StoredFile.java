package com.filestorage.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
@Table(
        name = "files",
        indexes = {
                @Index(name = "idx_files_tenant_id", columnList = "tenant_id"),
                @Index(name = "idx_files_status_created_at", columnList = "status, created_at"),
                @Index(name = "idx_files_file_key", columnList = "file_key")
        }
)
public class StoredFile {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "file_key", nullable = false, length = 1000)
    private String fileKey;

    @Column(name = "original_name", length = 500)
    private String originalName;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
