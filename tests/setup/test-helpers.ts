import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a test user
 */
export async function createTestUser(overrides: Partial<{
  clerkId: string;
  email: string;
  name: string;
  location: string;
  role: UserRole;
}> = {}) {
  const randomId = Math.random().toString(36).substring(7);

  return await prisma.user.create({
    data: {
      clerkId: `clerk_test_${randomId}`,
      email: `test_${randomId}@example.com`,
      name: 'Test User',
      role: UserRole.CUSTOMER,
      ...overrides,
    },
  });
}

/**
 * Create a test order
 */
export async function createTestOrder(
  userId: string,
  overrides: Partial<{
    orderNumber: string;
    description: string;
    status: any;
  }> = {}
) {
  const randomId = Math.random().toString(36).substring(7);

  return await prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-${randomId}`,
      userId,
      description: 'Test order description',
      status: 'RECEIVED',
      ...overrides,
    },
  });
}

/**
 * Mock Clerk user object
 */
export function mockClerkUser(overrides: Partial<{
  id: string;
  email: string;
  role: UserRole;
}> = {}) {
  const randomId = Math.random().toString(36).substring(7);

  return {
    id: `user_${randomId}`,
    emailAddress: `mock_${randomId}@example.com`,
    role: UserRole.CUSTOMER,
    ...overrides,
  };
}
