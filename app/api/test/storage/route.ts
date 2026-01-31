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
          // Railway default names
          bucket: process.env.BUCKET || 'NOT_SET',
          accessKeyId: process.env.ACCESS_KEY_ID ? '***SET***' : 'NOT_SET',
          secretAccessKey: process.env.SECRET_ACCESS_KEY ? '***SET***' : 'NOT_SET',
          endpoint: process.env.ENDPOINT || 'NOT_SET',
          region: process.env.REGION || 'NOT_SET',
          // Custom prefixed names (fallback)
          railwayBucketName: process.env.RAILWAY_BUCKET_NAME || 'NOT_SET',
          railwayBucketAccessKey: process.env.RAILWAY_BUCKET_ACCESS_KEY ? '***SET***' : 'NOT_SET',
          railwayBucketSecretKey: process.env.RAILWAY_BUCKET_SECRET_KEY ? '***SET***' : 'NOT_SET',
          railwayBucketEndpoint: process.env.RAILWAY_BUCKET_ENDPOINT || 'NOT_SET',
          railwayBucketRegion: process.env.RAILWAY_BUCKET_REGION || 'NOT_SET',
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
        bucket: process.env.BUCKET || process.env.RAILWAY_BUCKET_NAME,
        endpoint: process.env.ENDPOINT || process.env.RAILWAY_BUCKET_ENDPOINT,
        region: process.env.REGION || process.env.RAILWAY_BUCKET_REGION,
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
