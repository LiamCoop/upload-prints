import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim());

  if (adminEmails.length === 0 || adminEmails[0] === '') {
    console.log('No admin emails configured in ADMIN_EMAILS environment variable.');
    console.log('Skipping admin user creation.');
    return;
  }

  console.log(`Creating admin users for emails: ${adminEmails.join(', ')}`);

  for (const email of adminEmails) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`Admin user ${email} already exists, skipping...`);
      continue;
    }

    // Create placeholder admin user
    // Note: clerkId will be updated via webhook when user signs up in Clerk
    const admin = await prisma.user.create({
      data: {
        clerkId: `placeholder_${Date.now()}_${Math.random()}`,
        email,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    console.log(`Created admin user: ${admin.email}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
