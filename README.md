# Upload Prints - 3D Printing Order Management System

A full-stack web application for managing 3D print order submissions and workflow, from customer upload through admin processing to completion.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Railway)
- **Auth**: Clerk (managed authentication)
- **Storage**: Railway Buckets (S3-compatible for STL files)
- **Testing**: Vitest (unit + integration)
- **Deployment**: Railway
- **UI**: shadcn/ui + Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Railway account (for deployment)
- Clerk account (for authentication)

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```

   You'll need to configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - Clerk keys (from clerk.com dashboard)
   - Railway Bucket credentials (from railway.app)
   - `ADMIN_EMAILS` - Comma-separated list of admin emails

3. **Set up the database**:
   ```bash
   # Run migrations
   npm run prisma:migrate

   # Generate Prisma client
   npm run prisma:generate

   # Seed admin users (optional)
   npm run prisma:seed
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run tests with:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## Project Structure

```
upload-prints/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   ├── (customer)/          # Customer routes
│   ├── (admin)/             # Admin routes
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── customer/            # Customer-specific components
│   ├── admin/               # Admin-specific components
│   └── shared/              # Shared components
├── lib/
│   ├── services/            # Business logic
│   ├── storage/             # File storage (Railway Buckets)
│   ├── validators/          # Zod schemas
│   └── utils/               # Utility functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Database seeding
└── tests/
    ├── unit/                # Unit tests
    ├── integration/         # Integration tests
    └── setup/               # Test configuration
```

## Core Features

### Customer Flow
1. Sign up / Sign in (Clerk)
2. Create new order → Upload multiple STL files + metadata
3. Order created with status `RECEIVED`
4. View order status and processed files when ready

### Admin Flow
1. Sign in as admin
2. View inbox of new orders since last visit
3. Browse/filter all orders by status
4. Click into order → view files, customer info
5. Transition status through workflow
6. Upload processed files (draftsperson's work)

## Order Status Workflow

```
RECEIVED → REVIEWING → READY_FOR_PRINT → SENT_TO_PRINTER → COMPLETED
```

## Railway Deployment

### 1. Create Railway Services

1. **PostgreSQL Database**
   - Create a new PostgreSQL database in Railway
   - Copy the `DATABASE_URL` connection string

2. **Railway Bucket**
   - Create a new bucket in Railway
   - Note the access key, secret key, and endpoint

3. **Web Service**
   - Connect your GitHub repository
   - Railway will auto-detect Next.js and use `railway.json` config

### 2. Configure Environment Variables

Set these in Railway dashboard:
- `DATABASE_URL` (auto-provided by PostgreSQL service)
- All Clerk variables
- Railway Bucket credentials
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_APP_URL` (your Railway app URL)

### 3. Deploy

Push to your connected branch, and Railway will automatically:
1. Run `npx prisma generate && npm run build`
2. Run `npx prisma migrate deploy && npm start`

## Development Workflow

### Phase 1: Foundation ✅
- [x] Next.js 16 setup
- [x] Prisma + PostgreSQL
- [x] Clerk authentication
- [x] Railway Buckets integration
- [x] Vitest setup
- [x] shadcn/ui components

### Phase 2: Order Creation & File Upload
- [ ] Order creation API
- [ ] File upload with presigned URLs
- [ ] Customer order form
- [ ] Multi-file upload UI

### Phase 3: Admin Dashboard
- [ ] Orders list with filters
- [ ] Admin role-based access
- [ ] Order table component

### Phase 4: Admin Inbox & Detail
- [ ] Inbox for new orders
- [ ] Order detail view
- [ ] Status timeline

### Phase 5: Status Management
- [ ] Status transition logic
- [ ] Status validation
- [ ] Admin status UI

### Phase 6: Processed File Upload
- [ ] Admin file upload
- [ ] Processed file storage

### Phase 7: Customer Dashboard
- [ ] Customer orders list
- [ ] Customer order detail
- [ ] Download processed files

### Phase 8: Clerk Webhook
- [ ] User sync webhook
- [ ] Auto-admin assignment

### Phase 9: Polish
- [ ] Loading states
- [ ] Error boundaries
- [ ] Retry logic
- [ ] Mobile responsive

### Phase 10: Testing & Docs
- [ ] >80% test coverage
- [ ] Load testing
- [ ] Security audit

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Generate coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations (dev)
- `npm run prisma:deploy` - Deploy migrations (production)
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## License

Private project
