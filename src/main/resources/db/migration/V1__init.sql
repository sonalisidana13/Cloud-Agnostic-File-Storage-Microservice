CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    file_key VARCHAR(1000) NOT NULL,
    original_name VARCHAR(500),
    content_type VARCHAR(255),
    size_bytes BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    uploaded_at TIMESTAMP
);

CREATE TABLE tenant_metrics (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    total_files BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_tenant_id ON files(tenant_id);
CREATE INDEX idx_files_status_created_at ON files(status, created_at);
CREATE INDEX idx_files_file_key ON files(file_key);
