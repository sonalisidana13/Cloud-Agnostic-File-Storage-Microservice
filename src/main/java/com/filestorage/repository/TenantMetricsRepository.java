package com.filestorage.repository;

import com.filestorage.model.TenantMetrics;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantMetricsRepository extends JpaRepository<TenantMetrics, UUID> {
}
