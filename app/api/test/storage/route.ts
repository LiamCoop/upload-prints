import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/clerk';
import { generateUploadUrl, generateStorageKey, verifyFileExists } from '@/lib/storage/railway-buckets';

export async function GET() {
  try {
    // Require admin to prevent abuse
    await requireAdmin();

    const testKey = generateStorageKey('test-user', 'test-file.txt');

    // Test 1: Generate upload URL
    let uploadUrl: string;
    try {
      uploadUrl = await generateUploadUrl(testKey, 300); // 5 min expiry
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
        envCheck: {
          hasAccessKey: !!process.env.RAILWAY_BUCKET_ACCESS_KEY,
          hasSecretKey: !!process.env.RAILWAY_BUCKET_SECRET_KEY,
          hasEndpoint: !!process.env.RAILWAY_BUCKET_ENDPOINT,
          hasBucketName: !!process.env.RAILWAY_BUCKET_NAME,
          endpoint: process.env.RAILWAY_BUCKET_ENDPOINT || 'NOT_SET',
          bucketName: process.env.RAILWAY_BUCKET_NAME || 'NOT_SET',
          region: process.env.RAILWAY_BUCKET_REGION || 'NOT_SET',
        }
      }, { status: 500 });
    }

    // Test 2: Verify a non-existent file returns false
    const exists = await verifyFileExists(testKey);

    return NextResponse.json({
      success: true,
      tests: {
        uploadUrlGeneration: uploadUrl ? 'PASS' : 'FAIL',
        fileVerification: !exists ? 'PASS' : 'FAIL (should be false for non-existent file)',
      },
      config: {
        endpoint: process.env.RAILWAY_BUCKET_ENDPOINT,
        bucketName: process.env.RAILWAY_BUCKET_NAME,
        region: process.env.RAILWAY_BUCKET_REGION,
      },
      uploadUrl: uploadUrl.substring(0, 100) + '...',
      testStorageKey: testKey,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
