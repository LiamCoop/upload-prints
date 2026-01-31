# Setup Guide - Railway & Clerk Configuration

This guide will walk you through setting up Railway (database + buckets) and Clerk (authentication) for the Upload Prints application.

## Phase 1: Clerk Setup (Authentication)

### 1. Create Clerk Account

1. Go to https://clerk.com and sign up for a free account
2. Create a new application:
   - Application name: "Upload Prints"
   - Select "Email" and "Password" as authentication methods
   - Click "Create Application"

### 2. Get Clerk API Keys

1. In your Clerk dashboard, go to **API Keys** (left sidebar)
2. Copy the following values:
   - **Publishable Key** - starts with `pk_test_...`
   - **Secret Key** - starts with `sk_test_...` (click "Reveal" to see it)

3. Update your `.env` file:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   ```

### 3. Configure Clerk Paths

In your Clerk dashboard:
1. Go to **Paths** (under User & Authentication)
2. Set these redirect URLs:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in**: `/`
   - **After sign-up**: `/`

### 4. Set Up Webhook (for user sync)

1. In Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. For now, use placeholder URL: `https://placeholder.com/api/webhooks/clerk`
   - We'll update this after deploying to Railway
4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret** (starts with `whsec_...`)
6. Update your `.env`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

---

## Phase 2: Railway Setup (Database + Storage)

### 1. Create Railway Account

1. Go to https://railway.app and sign up
2. Connect your GitHub account (recommended for deployments)

### 2. Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo** (or **Empty Project** for now)

### 3. Add PostgreSQL Database

1. In your Railway project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway will provision a PostgreSQL database
4. Click on the PostgreSQL service
5. Go to **Variables** tab
6. Copy the `DATABASE_URL` value
7. Update your `.env`:
   ```bash
   DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
   ```

### 4. Add Railway Bucket (S3-compatible storage)

1. In your Railway project, click **+ New**
2. Select **Bucket**
3. Configure the bucket:
   - Name: `upload-prints-files`
   - Region: Choose closest to your users (e.g., `us-west-1`)
4. After creation, go to the bucket's **Variables** tab
5. Copy these values:
   - `BUCKET_ACCESS_KEY_ID` → Use as `RAILWAY_BUCKET_ACCESS_KEY`
   - `BUCKET_SECRET_ACCESS_KEY` → Use as `RAILWAY_BUCKET_SECRET_KEY`
   - `BUCKET_ENDPOINT` → Use as `RAILWAY_BUCKET_ENDPOINT`
   - `BUCKET_REGION` → Use as `RAILWAY_BUCKET_REGION`

6. Update your `.env`:
   ```bash
   RAILWAY_BUCKET_ACCESS_KEY=your_access_key
   RAILWAY_BUCKET_SECRET_KEY=your_secret_key
   RAILWAY_BUCKET_NAME=upload-prints-files
   RAILWAY_BUCKET_REGION=us-west-1
   RAILWAY_BUCKET_ENDPOINT=https://...railway.app
   ```

### 5. Configure CORS for Bucket (Important!)

Railway Buckets need CORS configuration to allow browser uploads:

1. In Railway dashboard, go to your Bucket service
2. Navigate to **Settings** → **CORS**
3. Add this CORS policy:
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["http://localhost:3000", "https://your-app-url.railway.app"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

---

## Phase 3: Run Database Migrations

Once you have `DATABASE_URL` configured:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Seed admin user (optional - update ADMIN_EMAILS in .env first)
npm run prisma:seed
```

---

## Phase 4: Test Locally

1. Make sure all environment variables are set in `.env`
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000
4. Try signing up - you should be redirected to Clerk's sign-up page
5. After sign-up, check your database to verify the user was created via webhook

---

## Phase 5: Deploy to Railway

### 1. Connect GitHub Repository

1. Push your code to GitHub (create a new repo if needed)
2. In Railway project, click **+ New**
3. Select **GitHub Repo**
4. Choose your `upload-prints` repository
5. Railway will auto-detect Next.js and use the `railway.json` config

### 2. Set Environment Variables in Railway

1. Click on your web service in Railway
2. Go to **Variables** tab
3. Add all environment variables from your `.env`:
   - `DATABASE_URL` (should be auto-linked to your PostgreSQL service)
   - All Clerk keys
   - All Railway Bucket keys
   - `NEXT_PUBLIC_APP_URL` - Your Railway app URL (e.g., `https://upload-prints-production.up.railway.app`)
   - `ADMIN_EMAILS` - Your admin email address
   - `NODE_ENV=production`

### 3. Deploy

1. Railway will automatically deploy when you push to your connected branch
2. Watch the build logs in Railway dashboard
3. Once deployed, Railway will provide a public URL

### 4. Update Clerk Webhook URL

1. Go back to Clerk dashboard → Webhooks
2. Edit the webhook endpoint you created earlier
3. Update the URL to: `https://your-railway-url.railway.app/api/webhooks/clerk`
4. Save changes

### 5. Update Bucket CORS

Update your Railway Bucket CORS policy to include your production URL:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://your-railway-url.railway.app"
      ],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## Troubleshooting

### Build fails with "Missing publishableKey"

- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Railway variables
- The `NEXT_PUBLIC_` prefix is important for client-side access

### Database migration fails

- Check `DATABASE_URL` is correct
- Ensure Railway PostgreSQL service is running
- Try running migrations manually: `npx prisma migrate deploy`

### File upload fails

- Verify Railway Bucket credentials are correct
- Check CORS configuration includes your app's URL
- Inspect browser console for CORS errors

### Clerk webhook not working

- Verify webhook URL is correct and publicly accessible
- Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Look at Railway logs for webhook errors

---

## Next Steps

Once everything is deployed and working:

1. ✅ Test sign-up flow
2. ✅ Verify admin user has correct role (check database or Prisma Studio)
3. ✅ Test file upload to Railway Buckets (once we build Phase 2)
4. 📍 **You are here** - Ready to build Phase 2: Order Creation & File Upload!

---

## Quick Reference

### Environment Variables Checklist

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `RAILWAY_BUCKET_ACCESS_KEY`
- [ ] `RAILWAY_BUCKET_SECRET_KEY`
- [ ] `RAILWAY_BUCKET_NAME`
- [ ] `RAILWAY_BUCKET_REGION`
- [ ] `RAILWAY_BUCKET_ENDPOINT`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `ADMIN_EMAILS`

### Railway Services Checklist

- [ ] PostgreSQL Database created
- [ ] Railway Bucket created
- [ ] Web Service connected to GitHub
- [ ] All environment variables set
- [ ] CORS configured on Bucket
- [ ] Deployed successfully

### Clerk Configuration Checklist

- [ ] Application created
- [ ] API keys copied
- [ ] Redirect paths configured
- [ ] Webhook endpoint created
- [ ] Webhook secret copied
- [ ] Webhook URL updated (after Railway deployment)
