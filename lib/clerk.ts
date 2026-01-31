import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

/**
 * Get the current user from Clerk and sync with database
 * @returns User from database or null if not authenticated
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

/**
 * Require user to be authenticated
 * @throws Error if user is not authenticated
 * @returns User from database
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: You must be logged in');
  }

  return user;
}

/**
 * Require user to have admin role
 * @throws Error if user is not authenticated or not an admin
 * @returns Admin user from database
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Check if user has admin role
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === UserRole.ADMIN;
  } catch {
    return false;
  }
}

/**
 * Get user role
 * @returns User role or null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}
