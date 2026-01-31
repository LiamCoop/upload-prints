import { prisma } from '@/lib/prisma';
import { OrdersTable } from '@/components/admin/orders-table';
import { OrderStatusFilter } from '@/components/admin/order-status-filter';
import { OrderStatus } from '@prisma/client';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as OrderStatus | undefined;
  const searchQuery = params.search;

  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter && { status: statusFilter }),
      ...(searchQuery && {
        OR: [
          { orderNumber: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { name: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          },
        ],
      }),
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          uploadedFiles: true,
          processedFiles: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Orders</h1>
      </div>

      <OrderStatusFilter />

      <OrdersTable orders={orders} />
    </div>
  );
}
