package com.filestorage.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
@Table(name = "tenant_metrics")
public class TenantMetrics {

    @Id
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "total_files")
    private Long totalFiles;

    @Column(name = "total_bytes")
    private Long totalBytes;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
