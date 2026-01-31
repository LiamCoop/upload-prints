import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            Upload Prints
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/orders"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/orders/new"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New Order
            </Link>
            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
