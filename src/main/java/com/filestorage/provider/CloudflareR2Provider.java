package com.filestorage.provider;

import com.filestorage.config.StorageProperties;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Component
@ConditionalOnProperty(name = "storage.provider", havingValue = "cloudflare-r2")
public class CloudflareR2Provider implements StorageProvider {

    private static final Region R2_REGION = Region.of("auto");
    private static final S3Configuration R2_S3_CONFIGURATION = S3Configuration.builder()
            .pathStyleAccessEnabled(true)
            .build();

    private final String bucketName;
    private final String accountId;
    private final String accessKey;
    private final String secretKey;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public CloudflareR2Provider(StorageProperties storageProperties) {
        this.bucketName = storageProperties.bucketName();
        this.accountId = storageProperties.accountId();
        this.accessKey = storageProperties.accessKey();
        this.secretKey = storageProperties.secretKey();

        AwsBasicCredentials credentials = AwsBasicCredentials.create(this.accessKey, this.secretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        URI endpointOverride = URI.create("https://" + this.accountId + ".r2.cloudflarestorage.com");

        this.s3Client = S3Client.builder()
                .region(R2_REGION)
                .credentialsProvider(credentialsProvider)
                .endpointOverride(endpointOverride)
                .serviceConfiguration(R2_S3_CONFIGURATION)
                .build();
        this.s3Presigner = S3Presigner.builder()
                .region(R2_REGION)
                .credentialsProvider(credentialsProvider)
                .endpointOverride(endpointOverride)
                .serviceConfiguration(R2_S3_CONFIGURATION)
                .build();
    }

    @Override
    public String generatePresignedUploadUrl(String fileKey, String contentType, long expiresInSeconds) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresInSeconds))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        return presignedRequest.url().toString();
    }

    @Override
    public String generatePresignedDownloadUrl(String fileKey, long expiresInSeconds) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresInSeconds))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    @Override
    public void upload(String fileKey, String contentType, InputStream inputStream, long sizeBytes) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(contentType)
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, sizeBytes));
    }

    @Override
    public boolean exists(String fileKey) {
        HeadObjectRequest request = HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();

        try {
            s3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException exception) {
            return false;
        } catch (SdkException exception) {
            return false;
        }
    }

    @Override
    public void delete(String fileKey) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();
        s3Client.deleteObject(request);
    }

    @Override
    public String getProviderName() {
        return "cloudflare-r2";
    }
}
