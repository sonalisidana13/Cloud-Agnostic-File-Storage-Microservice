package com.filestorage.security;

import com.filestorage.model.Tenant;
import com.filestorage.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String UNAUTHORIZED_BODY = "{ \"error\": \"Invalid or missing API key\" }";

    private final TenantRepository tenantRepository;
    private final RequestMatcher publicEndpoints = new OrRequestMatcher(
        new AntPathRequestMatcher("/api/health"),
        new AntPathRequestMatcher("/api/demo/tenants"),
        new AntPathRequestMatcher("/api/demo/tenants/**"),
        new AntPathRequestMatcher("/actuator/health"),
        new AntPathRequestMatcher("/swagger-ui/**"),
        new AntPathRequestMatcher("/v3/api-docs/**")
    );

    public ApiKeyAuthFilter(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return publicEndpoints.matches(request) || CorsUtils.isPreFlightRequest(request);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            writeUnauthorizedResponse(response);
            return;
        }

        Optional<Tenant> tenant = tenantRepository.findByApiKey(apiKey);
        if (tenant.isEmpty()) {
            writeUnauthorizedResponse(response);
            return;
        }

        Tenant authenticatedTenant = tenant.get();

        try {
            TenantContext.set(authenticatedTenant);
            SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(authenticatedTenant, null, List.of())
            );
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private void writeUnauthorizedResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(UNAUTHORIZED_BODY);
    }
}
