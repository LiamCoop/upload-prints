import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/clerk';
import { verifyFileExists } from '@/lib/storage/railway-buckets';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; fileId: string }> }
) {
  try {
    const user = await requireAuth();
    const { orderId, fileId } = await params;
    let body: { fileType?: 'uploaded' | 'processed' } | null = null;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const requestedFileType = body?.fileType === 'processed' ? 'processed' : 'uploaded';
    const isAdmin = user.role === 'ADMIN';

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!isAdmin && order.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (requestedFileType === 'processed' && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (requestedFileType === 'processed') {
      const file = await prisma.processedFile.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      if (file.orderId !== orderId) {
        return NextResponse.json({ error: 'File does not belong to this order' }, { status: 400 });
      }

      const exists = await verifyFileExists(file.storageKey);

      if (!exists) {
        return NextResponse.json(
          { error: 'File not found in storage' },
          { status: 400 }
        );
      }

      const updatedFile = await prisma.processedFile.update({
        where: { id: fileId },
        data: { storageUrl: file.storageKey },
      });

      return NextResponse.json({
        id: updatedFile.id,
        fileName: updatedFile.fileName,
        fileType: 'processed',
      });
    }

    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.orderId !== orderId) {
      return NextResponse.json({ error: 'File does not belong to this order' }, { status: 400 });
    }

    const exists = await verifyFileExists(file.storageKey);

    if (!exists) {
      await prisma.uploadedFile.update({
        where: { id: fileId },
        data: { uploadStatus: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 400 }
      );
    }

    const updatedFile = await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        uploadStatus: 'COMPLETED',
        storageUrl: file.storageKey, // Use storage key as reference
      },
    });

    return NextResponse.json({
      id: updatedFile.id,
      fileName: updatedFile.fileName,
      uploadStatus: updatedFile.uploadStatus,
      fileType: 'uploaded',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error confirming upload:', error);
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}
