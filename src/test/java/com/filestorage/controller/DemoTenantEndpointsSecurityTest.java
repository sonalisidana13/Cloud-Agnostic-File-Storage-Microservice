package com.filestorage.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.filestorage.config.SecurityConfig;
import com.filestorage.dto.DemoTenantMetricsResponse;
import com.filestorage.dto.DemoTenantSummaryResponse;
import com.filestorage.repository.TenantRepository;
import com.filestorage.security.ApiKeyAuthFilter;
import com.filestorage.service.MetricsService;
import com.filestorage.service.TenantService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({TenantController.class, MetricsController.class})
@Import({SecurityConfig.class, ApiKeyAuthFilter.class})
class DemoTenantEndpointsSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TenantService tenantService;

    @MockBean
    private MetricsService metricsService;

    @MockBean
    private TenantRepository tenantRepository;

    @Test
    void demoTenantListEndpointIsPublic() throws Exception {
        when(tenantService.listDemoTenants()).thenReturn(List.of(
                new DemoTenantSummaryResponse(
                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                        "alpha",
                        "demo_alpha",
                        Instant.parse("2026-05-25T12:00:00Z")
                )
        ));

        mockMvc.perform(get("/api/demo/tenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenantName").value("alpha"))
                .andExpect(jsonPath("$[0].apiKey").value("demo_alpha"));
    }

    @Test
    void demoTenantMetricsEndpointIsPublic() throws Exception {
        when(metricsService.listAllTenantMetrics()).thenReturn(List.of(
                new DemoTenantMetricsResponse(
                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                        "alpha",
                        Instant.parse("2026-05-25T12:00:00Z"),
                        2L,
                        2048L,
                        "2.0 KB",
                        "cloudflare-r2"
                )
        ));

        mockMvc.perform(get("/api/demo/tenants/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenantName").value("alpha"))
                .andExpect(jsonPath("$[0].totalFiles").value(2));
    }

    @Test
    void protectedMetricsEndpointStillRequiresApiKey() throws Exception {
        mockMvc.perform(get("/api/metrics"))
                .andExpect(status().isUnauthorized());
    }
}
