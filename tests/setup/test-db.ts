import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean all data from the database
 * Use this in beforeEach to ensure clean state for tests
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.adminAction.deleteMany(),
    prisma.statusChange.deleteMany(),
    prisma.processedFile.deleteMany(),
    prisma.uploadedFile.deleteMany(),
    prisma.order.deleteMany(),
    prisma.adminSession.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Initialize test database
 * Run migrations and prepare for testing
 */
export async function createTestDatabase() {
  // Database should be initialized with migrations before running tests
  // This function is a placeholder for any additional setup needed
  console.log('Test database ready');
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export { prisma as testPrisma };
