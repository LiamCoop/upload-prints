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
  RECEIVED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800',
  READY_FOR_PRINT: 'bg-purple-100 text-purple-800',
  SENT_TO_PRINTER: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
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
        where: { uploadStatus: 'COMPLETED' },
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
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            {order.uploadedFiles.length} file{order.uploadedFiles.length !== 1 ? 's' : ''} submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {order.uploadedFiles.length > 0 ? (
            <ul className="space-y-2">
              {order.uploadedFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No files uploaded</p>
          )}
        </CardContent>
      </Card>

      {order.processedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Files</CardTitle>
            <CardDescription>
              Files prepared by our team for printing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {order.processedFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                    {file.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{file.notes}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  );
}
