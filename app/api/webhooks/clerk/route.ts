import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error('No email address found for user:', id);
      return new Response('No email address', { status: 400 });
    }

    // Check if user should be admin
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const isAdminUser = adminEmails.includes(email.toLowerCase());

    const name = first_name ? `${first_name} ${last_name || ''}`.trim() : null;

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        name,
        role: isAdminUser ? UserRole.ADMIN : UserRole.CUSTOMER,
      },
      create: {
        clerkId: id,
        email,
        name,
        role: isAdminUser ? UserRole.ADMIN : UserRole.CUSTOMER,
      },
    });

    console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'}:`, id);
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (id) {
      // Delete user and cascade to orders
      await prisma.user.delete({
        where: { clerkId: id },
      }).catch((err) => {
        // User might not exist in our DB
        console.log('User not found for deletion:', id, err);
      });

      console.log('User deleted:', id);
    }
  }

  return new Response('OK', { status: 200 });
}
