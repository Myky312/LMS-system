/**
 * Storage abstraction for S3-compatible backends (MinIO, AWS S3).
 * Implementations provide presigned upload URLs; switching providers is an env change only.
 */
export interface StorageProvider {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{
    uploadUrl: string;
    fileKey: string;
  }>;
}
