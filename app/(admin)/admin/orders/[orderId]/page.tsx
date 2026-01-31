import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/clerk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@prisma/client';

const statusLabels: Record<OrderStatus, string> = {
  RECEIVED: 'Received',
  REVIEWING: 'Reviewing',
  READY_FOR_PRINT: 'Ready for Print',
  SENT_TO_PRINTER: 'Sent to Printer',
  COMPLETED: 'Completed',
};

const statusColors: Record<OrderStatus, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800',
  READY_FOR_PRINT: 'bg-purple-100 text-purple-800',
  SENT_TO_PRINTER: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const admin = await requireAdmin();
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      uploadedFiles: {
        where: { uploadStatus: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
      },
      processedFiles: {
        orderBy: { createdAt: 'asc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Log admin action
  await prisma.adminAction.create({
    data: {
      orderId: order.id,
      adminId: admin.clerkId,
      actionType: 'VIEWED_ORDER',
      description: `Viewed order ${order.orderNumber}`,
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{order.user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{order.user.email}</p>
            </div>
            {order.user.location && (
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{order.user.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="font-medium">Received</p>
              <p className="text-muted-foreground">{order.receivedAt.toLocaleString()}</p>
            </div>
            {order.reviewedAt && (
              <div className="text-sm">
                <p className="font-medium">Reviewed</p>
                <p className="text-muted-foreground">{order.reviewedAt.toLocaleString()}</p>
              </div>
            )}
            {order.readyAt && (
              <div className="text-sm">
                <p className="font-medium">Ready for Print</p>
                <p className="text-muted-foreground">{order.readyAt.toLocaleString()}</p>
              </div>
            )}
            {order.sentToPrinterAt && (
              <div className="text-sm">
                <p className="font-medium">Sent to Printer</p>
                <p className="text-muted-foreground">{order.sentToPrinterAt.toLocaleString()}</p>
              </div>
            )}
            {order.completedAt && (
              <div className="text-sm">
                <p className="font-medium">Completed</p>
                <p className="text-muted-foreground">{order.completedAt.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            {order.uploadedFiles.length} file{order.uploadedFiles.length !== 1 ? 's' : ''} from customer
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
                      {formatFileSize(file.fileSize)} • {file.mimeType}
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
            <CardDescription>Files prepared for printing</CardDescription>
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
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  );
}
