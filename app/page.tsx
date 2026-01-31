import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Upload Prints</h1>
        <p className="text-xl text-muted-foreground mb-8">
          3D Printing Order Management System
        </p>
        <div className="flex gap-4 justify-center">
          {userId ? (
            <>
              <Link href="/orders">
                <Button>My Orders</Button>
              </Link>
              <Link href="/orders/new">
                <Button variant="outline">New Order</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
