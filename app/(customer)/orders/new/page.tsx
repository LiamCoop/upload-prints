import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OrderForm } from '@/components/customer/order-form';

export default async function NewOrderPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="py-8">
      <OrderForm />
    </div>
  );
}
