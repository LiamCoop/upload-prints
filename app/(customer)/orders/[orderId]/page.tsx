import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const statusLabels: Record<string, string> = {
  RECEIVED: 'Received',
  REVIEWING: 'Under Review',
  READY_FOR_PRINT: 'Ready for Print',
  SENT_TO_PRINTER: 'Sent to Printer',
  COMPLETED: 'Completed',
};

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
  READY_FOR_PRINT: 'bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800',
  SENT_TO_PRINTER: 'bg-orange-100 text-orange-800 hover:bg-orange-100 hover:text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { userId } = await auth();
  const { orderId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      uploadedFiles: {
        orderBy: { createdAt: 'asc' },
      },
      processedFiles: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  if (order.userId !== user.id) {
    notFound();
  }

  // Get all unique uploader clerk IDs
  const uploaderClerkIds = new Set<string>();
  order.uploadedFiles.forEach(file => uploaderClerkIds.add(file.uploadedBy));
  order.processedFiles.forEach(file => uploaderClerkIds.add(file.uploadedBy));

  // Fetch user info for all uploaders
  const uploaders = await prisma.user.findMany({
    where: {
      clerkId: { in: Array.from(uploaderClerkIds) }
    },
    select: {
      clerkId: true,
      name: true,
      email: true,
      role: true,
    }
  });

  const uploaderMap = new Map(uploaders.map(u => [u.clerkId, u]));

  // Combine all files with uploader info
  const allFiles = [
    ...order.uploadedFiles.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      uploadedBy: file.uploadedBy,
      type: 'customer' as const,
      notes: null,
    })),
    ...order.processedFiles.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      uploadedBy: file.uploadedBy,
      type: 'admin' as const,
      notes: file.notes,
    }))
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Submitted on {order.receivedAt.toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[order.status]}>
          {statusLabels[order.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{order.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>
            {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allFiles.length > 0 ? (
            <ul className="space-y-4">
              {allFiles.map((file) => {
                const uploader = uploaderMap.get(file.uploadedBy);
                const isAdmin = uploader?.role === 'ADMIN';
                const uploaderName = uploader?.name || uploader?.email || 'Unknown';

                return (
                  <li
                    key={file.id}
                    className="p-4 bg-white rounded-md border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.fileName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground">
                            {file.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {uploaderName}
                          </p>
                          {isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        {file.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            Note: {file.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No files uploaded</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  );
}
