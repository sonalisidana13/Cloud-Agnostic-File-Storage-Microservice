package com.filestorage.repository;

import com.filestorage.model.StoredFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByIdAndTenantId(UUID id, UUID tenantId);

    List<StoredFile> findByTenantIdAndStatus(UUID tenantId, String status);

    @Query("SELECT f FROM StoredFile f WHERE f.status = 'PENDING' AND f.createdAt < :cutoff")
    List<StoredFile> findStalePendingFiles(@Param("cutoff") LocalDateTime cutoff);
}
