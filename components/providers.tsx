"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  // Skip ClerkProvider if publishable key is not available (during build)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
