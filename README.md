# Cloud-Agnostic File Storage Microservice

A Spring Boot microservice for direct-to-object-storage uploads, tenant-scoped file metadata, and storage-provider switching with zero code changes.

## Why cloud-agnostic?

This service keeps object storage behind a small `StorageProvider` interface so the application logic does not care whether files live in Cloudflare R2 or AWS S3 today, and can be extended to other S3-compatible providers later.

### Cost snapshot

| Provider | Storage | Egress | Free Tier |
| --- | --- | --- | --- |
| Cloudflare R2 | $0.015/GB | $0.00/GB | 10GB storage, unlimited egress |
| AWS S3 | $0.023/GB | $0.09/GB | 5GB (12 months only) |
| DO Spaces | $0.020/GB | $0.01/GB | 250GB storage, 1TB egress |
| GCS | $0.020/GB | $0.08/GB | 5GB free |

R2's zero egress cost makes it 4-9x cheaper than S3 for read-heavy workloads. Switching requires one env var change.

Note: These are simplified headline numbers for quick comparison. Exact pricing varies by region, storage class, traffic pattern, and account type. AWS also changed its new-account free-tier model in July 2025, so treat the AWS row above as a simple architectural comparison, not billing advice. Official pricing pages: Cloudflare R2: https://developers.cloudflare.com/r2/pricing/ | AWS S3: https://aws.amazon.com/s3/pricing/ | DigitalOcean Spaces: https://docs.digitalocean.com/products/spaces/details/pricing/ | Google Cloud Storage: https://cloud.google.com/storage/pricing

## Architecture

Files never pass through the service. The backend generates a presigned URL; the client uploads directly to R2.

The service stores only metadata in PostgreSQL: tenant, object key, content type, size, upload status, and aggregate metrics. That keeps the API small, reduces backend bandwidth costs, and makes provider switching straightforward.

Local configuration is loaded automatically from `.env` at application startup, so you do not need to keep exporting variables from `~/.zshrc` for local development.

## How to switch providers

Current built-in providers:

- `cloudflare-r2`
- `aws-s3`

Use the environment variable below:

```env
STORAGE_PROVIDER=aws-s3          # use AWS
STORAGE_PROVIDER=cloudflare-r2   # use R2 (default)
```

Zero code change required.

## Tech stack

- Spring Boot 3
- PostgreSQL
- Flyway
- AWS SDK for Java v2
- Render for backend deployment
- Supabase Postgres for the managed database
- Vercel for a companion frontend or client app deployment

## Local setup

### Prerequisites

- JDK 17 or newer
- Maven 3.9+
- PostgreSQL 14+ or a Supabase Postgres project
- A Cloudflare R2 bucket or AWS S3 bucket

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd Cloud-Agnostic-File-Storage-Microservice
```

### 2. Prepare your database

You have two easy options:

- Local Postgres:

```sql
CREATE DATABASE file_storage;
```

- Supabase:
  Create a new Supabase project, open the `Connect` panel, and copy either:
  - the direct connection string if your environment supports IPv6, or
  - the Supavisor session pooler string if you need IPv4 support.

### 3. Create your local env file

Copy `.env.example` to `.env` and fill in real values:

```env
DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/file_storage
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_SCHEMA=file_storage

STORAGE_PROVIDER=cloudflare-r2
STORAGE_BUCKET_NAME=your-bucket
STORAGE_ACCOUNT_ID=your-r2-account-id
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=us-east-1
```

Recommended local setup:

- Use `127.0.0.1` instead of `localhost` to avoid IPv4/IPv6 resolution issues on some machines.
- Use `DATABASE_SCHEMA=file_storage` if you want this app’s tables isolated from other tables in the same database.
- Keep `DATABASE_SCHEMA=public` only if you want Flyway and JPA to use the default schema.

If you are using Supabase, set `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` from the connection details in your Supabase dashboard. Supabase recommends direct connections for persistent backends when IPv6 is available, and the session pooler when IPv4 compatibility is needed.

If you are using a schema inside an existing database, point `DATABASE_URL` at the database and set `DATABASE_SCHEMA` to that schema name. Example:

```env
DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/postgres
DATABASE_SCHEMA=file_storage
```

### 4. Start the service

```bash
mvn spring-boot:run
```

The app auto-loads `.env` on startup. Flyway will create the schema history table and application tables automatically.

### 5. Verify the app started

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "file-storage-service"
}
```

### 6. Seed a tenant for local testing

Every protected endpoint expects an `X-API-Key` header that maps to a tenant record.

```sql
INSERT INTO tenants (name, api_key)
VALUES ('demo-tenant', 'dev-api-key');
```

### 7. Confirm Flyway created the tables

In your selected schema, you should now see:

- `flyway_schema_history`
- `tenants`
- `files`
- `tenant_metrics`

### 8. Set helper shell variables for API testing

```bash
export API_URL=http://localhost:8080
export API_KEY=dev-api-key
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | Yes | PostgreSQL username |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password |
| `DATABASE_SCHEMA` | Optional | Database schema used by Flyway, Hibernate, and Hikari; defaults to `public` |
| `STORAGE_PROVIDER` | Yes | `cloudflare-r2` or `aws-s3` |
| `STORAGE_BUCKET_NAME` | Yes | Bucket name |
| `STORAGE_ACCOUNT_ID` | R2 only | Cloudflare account ID |
| `STORAGE_ACCESS_KEY` | Yes | Storage access key |
| `STORAGE_SECRET_KEY` | Yes | Storage secret key |
| `STORAGE_REGION` | Optional for AWS | AWS region, defaults to `us-east-1` |

## API endpoints

All endpoints except health require:

```http
X-API-Key: <tenant-api-key>
```

### Health check

```bash
curl "$API_URL/api/health"
```

### Initiate upload

Creates a pending file record and returns a presigned upload URL.

```bash
curl -X POST "$API_URL/api/files/initiate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "fileName": "hello.txt",
    "contentType": "text/plain",
    "sizeBytes": 12
  }'
```

Example response:

```json
{
  "fileId": "8b8d2d0f-2d67-4e95-97e3-5ac18f7f44e2",
  "uploadUrl": "https://...",
  "expiresAt": "2026-05-24T07:30:00Z"
}
```

### Upload the file directly to object storage

This is not a backend endpoint, but it is step two of the flow. Use the returned `uploadUrl`:

```bash
curl -X PUT "<UPLOAD_URL>" \
  -H "Content-Type: text/plain" \
  --data-binary @hello.txt
```

### Complete upload

Marks the file as uploaded after the client has finished uploading to object storage.

```bash
curl -X POST "$API_URL/api/files/<FILE_ID>/complete" \
  -H "X-API-Key: $API_KEY" \
  -i
```

### List files

Returns all uploaded files for the current tenant, including a presigned download URL.

```bash
curl "$API_URL/api/files" \
  -H "X-API-Key: $API_KEY"
```

### Get a download URL

```bash
curl "$API_URL/api/files/<FILE_ID>/download-url" \
  -H "X-API-Key: $API_KEY"
```

### Delete a file

Deletes the object from storage and marks the record as deleted.

```bash
curl -X DELETE "$API_URL/api/files/<FILE_ID>" \
  -H "X-API-Key: $API_KEY" \
  -i
```

### Get tenant metrics

Returns aggregate file count and byte usage for the current tenant.

```bash
curl "$API_URL/api/metrics" \
  -H "X-API-Key: $API_KEY"
```

Example response:

```json
{
  "tenantId": "9fe7e6f8-7f85-4a59-8898-a8bbfca560e7",
  "tenantName": "demo-tenant",
  "totalFiles": 1,
  "totalBytes": 1048576,
  "totalBytesHuman": "1.0 MB",
  "provider": "cloudflare-r2"
}
```

## Reconciliation poller

Cloudflare R2 does not provide native bucket event notifications like AWS S3, so the service includes a scheduled reconciliation poller. Every 60 seconds, it checks stale `PENDING` uploads older than 2 minutes, marks real objects as `UPLOADED`, marks missing ones as `FAILED`, and updates tenant metrics when it recovers a successful upload.

## Deployment

### Run with Docker

```bash
docker build -t file-storage-service .
docker run --env-file .env -p 8080:8080 file-storage-service
```

### Render + Supabase

This repo includes:

- `Dockerfile`
- `render.yaml`
- `.env.example`

Deploy the app to a Render web service using the repo `Dockerfile`, and point `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` at your Supabase Postgres instance. Health checks use `GET /api/health`.

The Docker image now builds the Spring Boot jar inside the container, so Render does not need a checked-in `target/` directory or a separate prebuild step.

Recommended setup:

- Create a Supabase Postgres project first.
- In Supabase, copy the connection details from `Connect`.
- In Render, create a Docker-based web service from this repository.
- Add the same environment variables listed in `.env.example`.
- Set `DATABASE_SCHEMA` explicitly if you do not want to use `public`.
- Use `STORAGE_REGION` only when `STORAGE_PROVIDER=aws-s3`.
- Keep the health check path set to `/api/health`.

Reference docs:

- Render Blueprint and Docker deploy docs: https://render.com/docs/blueprint-spec and https://render.com/docs/docker
- Supabase connection strings: https://supabase.com/docs/reference/postgres/connection-strings
