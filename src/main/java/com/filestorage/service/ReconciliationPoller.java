package com.filestorage.service;

import com.filestorage.model.StoredFile;
import com.filestorage.provider.StorageProvider;
import com.filestorage.repository.StoredFileRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reconciliation poller — compensates for the absence of bucket event
 * notifications on Cloudflare R2. Runs every 60s to self-heal stuck uploads.
 */
@Component
public class ReconciliationPoller {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationPoller.class);
    private static final String UPLOADED_STATUS = "UPLOADED";
    private static final String FAILED_STATUS = "FAILED";

    private final StoredFileRepository storedFileRepository;
    private final StorageProvider storageProvider;
    private final MetricsService metricsService;

    public ReconciliationPoller(
            StoredFileRepository storedFileRepository,
            StorageProvider storageProvider,
            MetricsService metricsService
    ) {
        this.storedFileRepository = storedFileRepository;
        this.storageProvider = storageProvider;
        this.metricsService = metricsService;
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void reconcile() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusMinutes(2);
        List<StoredFile> staleFiles = storedFileRepository.findStalePendingFiles(cutoff);

        int uploadedCount = 0;
        int failedCount = 0;

        for (StoredFile storedFile : staleFiles) {
            if (storageProvider.exists(storedFile.getFileKey())) {
                storedFile.setStatus(UPLOADED_STATUS);
                storedFile.setUploadedAt(LocalDateTime.now(ZoneOffset.UTC));
                metricsService.updateMetrics(
                        storedFile.getTenantId(),
                        1L,
                        storedFile.getSizeBytes() == null ? 0L : storedFile.getSizeBytes()
                );
                uploadedCount++;
            } else {
                storedFile.setStatus(FAILED_STATUS);
                failedCount++;
            }
        }

        if (!staleFiles.isEmpty()) {
            storedFileRepository.saveAll(staleFiles);
        }

        log.info(
                "Reconciliation — resolved: {} uploaded, {} failed | provider: {}",
                uploadedCount,
                failedCount,
                storageProvider.getProviderName()
        );
    }
}
