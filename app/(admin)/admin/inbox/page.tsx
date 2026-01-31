import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/clerk';
import { OrdersTable } from '@/components/admin/orders-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminInboxPage() {
  const admin = await requireAdmin();

  // Get or create admin session
  const session = await prisma.adminSession.upsert({
    where: { adminId: admin.clerkId },
    update: {},
    create: {
      adminId: admin.clerkId,
      lastVisitAt: new Date(),
    },
  });

  // Get new orders since last visit
  const newOrders = await prisma.order.findMany({
    where: {
      receivedAt: {
        gt: session.lastVisitAt,
      },
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
    orderBy: { receivedAt: 'desc' },
  });

  // Update last visit time
  await prisma.adminSession.update({
    where: { adminId: admin.clerkId },
    data: { lastVisitAt: new Date() },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">
          New orders since your last visit on {session.lastVisitAt.toLocaleString()}
        </p>
      </div>

      {newOrders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All caught up!</CardTitle>
            <CardDescription>No new orders since your last visit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check the <a href="/admin/orders" className="underline">All Orders</a> page to view all orders.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {newOrders.length} new order{newOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <OrdersTable orders={newOrders} />
        </div>
      )}
    </div>
  );
}
