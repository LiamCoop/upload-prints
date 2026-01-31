import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/clerk';
import { generateDownloadUrl } from '@/lib/storage/railway-buckets';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await auth();
    const { orderId } = await params;

    if (!userId || userId !== admin.clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const files = await prisma.processedFile.findMany({
      where: { orderId },
      select: {
        id: true,
        fileName: true,
        storageKey: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const downloadUrls = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        fileName: file.fileName,
        downloadUrl: await generateDownloadUrl(file.storageKey),
      }))
    );

    return NextResponse.json({ files: downloadUrls });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.error('Error generating download URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URLs' },
      { status: 500 }
    );
  }
}
