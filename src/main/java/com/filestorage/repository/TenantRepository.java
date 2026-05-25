package com.filestorage.repository;

import com.filestorage.model.Tenant;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByApiKey(String apiKey);

    List<Tenant> findAllByOrderByCreatedAtDesc();
}
