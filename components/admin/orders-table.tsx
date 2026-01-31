import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface OrdersTableProps {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    receivedAt: Date;
    user: {
      email: string;
      name: string | null;
    };
    _count: {
      uploadedFiles: number;
      processedFiles: number;
    };
  }>;
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.user.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                </div>
              </TableCell>
              <TableCell>{order.receivedAt.toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{order._count.uploadedFiles} uploaded</p>
                  {order._count.processedFiles > 0 && (
                    <p className="text-muted-foreground">
                      {order._count.processedFiles} processed
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/orders/${order.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
