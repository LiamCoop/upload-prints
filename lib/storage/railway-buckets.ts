import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for Railway Buckets (S3-compatible)
const s3Client = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY || '',
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_KEY || '',
  },
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT,
  forcePathStyle: true, // Required for S3-compatible services
});

const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME || 'upload-prints-files';

/**
 * Generate a presigned URL for uploading a file
 * @param storageKey The key/path where the file will be stored
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for uploading
 */
export async function generateUploadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file
 * @param storageKey The key/path of the file to download
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for downloading
 */
export async function generateDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Verify that a file exists in the bucket
 * @param storageKey The key/path of the file to check
 * @returns True if file exists, false otherwise
 */
export async function verifyFileExists(storageKey: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a unique storage key for uploaded files
 * @param userId Clerk user ID
 * @param fileName Original file name
 * @param prefix Optional prefix (e.g., 'uploads' or 'processed')
 * @returns Unique storage key
 */
export function generateStorageKey(
  userId: string,
  fileName: string,
  prefix: string = 'uploads'
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${prefix}/${userId}/${timestamp}-${sanitizedFileName}`;
}
