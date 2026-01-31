import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/clerk';
import { generateUploadUrl, generateStorageKey } from '@/lib/storage/railway-buckets';

const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await requireAuth();
    const { userId } = await auth();
    const { orderId } = await params;

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow uploads for orders in RECEIVED status
    if (order.status !== 'RECEIVED') {
      return NextResponse.json(
        { error: 'Cannot upload files to this order' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = uploadUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, fileSize, mimeType } = parsed.data;

    // Generate storage key and presigned URL
    const storageKey = generateStorageKey(userId!, fileName);
    const uploadUrl = await generateUploadUrl(storageKey);

    // Create pending file record
    const file = await prisma.uploadedFile.create({
      data: {
        orderId,
        fileName,
        fileSize,
        mimeType,
        storageKey,
        storageUrl: '', // Will be set after upload confirmation
        uploadStatus: 'PENDING',
        uploadedBy: userId!,
      },
    });

    return NextResponse.json({
      fileId: file.id,
      uploadUrl,
      storageKey,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
