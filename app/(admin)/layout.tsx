import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { requireAdmin } from '@/lib/clerk';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-slate-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-lg">
              Upload Prints Admin
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/inbox"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Inbox
              </Link>
              <Link
                href="/admin/orders"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                All Orders
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Customer View
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
