import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestUser } from '../../setup/test-helpers';
import { prisma } from '@/lib/prisma';
import { POST as createOrder } from '@/app/api/orders/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

describe('POST /api/orders', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user
    testUser = await createTestUser({
      clerkId: 'user_test123',
      email: 'test@example.com',
    });

    // Mock Clerk to return our test user
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: testUser.clerkId } as any);
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    vi.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test order for 3D printing',
      }),
    });

    const response = await createOrder(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('orderNumber');
    expect(data.orderNumber).toMatch(/^ORD-\d{4}-\d{4}$/);
    expect(data.description).toBe('Test order for 3D printing');
    expect(data.status).toBe('RECEIVED');
    expect(data.userId).toBe(testUser.id);
  });

  it('should return 400 for missing description', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await createOrder(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for empty description', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '',
      }),
    });

    const response = await createOrder(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should return 401 when user is not authenticated', async () => {
    // Mock Clerk to return no user
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Test order',
      }),
    });

    const response = await createOrder(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should generate unique order numbers', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'First order',
      }),
    });

    const request2 = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Second order',
      }),
    });

    const response1 = await createOrder(request1);
    const response2 = await createOrder(request2);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1.orderNumber).not.toBe(data2.orderNumber);
  });

  it('should handle long descriptions', async () => {
    const longDescription = 'A'.repeat(5000);

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: longDescription,
      }),
    });

    const response = await createOrder(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.description).toBe(longDescription);
  });
});
