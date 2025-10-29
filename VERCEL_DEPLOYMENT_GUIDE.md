# Fresh Vercel Deployment Guide

## Prerequisites Checklist

- [ ] Supabase PostgreSQL database is running
- [ ] Database URL: `postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
- [ ] Database is seeded with courses, domains, job roles, and admin user
- [ ] Admin credentials: username `admin`, password `admin123`

## Step 1: Create Fresh GitHub Repository

1. Go to https://github.com/new
2. Repository name: `perscholas-pathway`
3. Description: "Per Scholas Training Pathway Manager"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Prepare Local Project

Extract the ZIP file I'll provide and navigate to it:

```bash
cd /path/to/extracted/perscholas-pathway
```

## Step 3: Initialize Git and Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Per Scholas Pathway Manager"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/perscholas-pathway.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Create Vercel Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and find `perscholas-pathway`
4. Click "Import"

### Configure Project Settings:

**Framework Preset:** Other (leave as detected)

**Root Directory:** `./` (leave as default)

**Build Command:** `pnpm build`

**Output Directory:** Leave empty (Vercel will auto-detect)

**Install Command:** `pnpm install`

## Step 5: Add Environment Variables

Before deploying, click "Environment Variables" and add:

### Required Variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-in-production-12345` |
| `NODE_ENV` | `production` |

**Important:** Make sure to select "Production", "Preview", and "Development" for all variables.

## Step 6: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Vercel will show you the deployment URL (e.g., `https://perscholas-pathway.vercel.app`)

## Step 7: Verify Deployment

Visit your deployment URL and test:

1. **Homepage loads** - ✅ Should show Per Scholas branding
2. **Browse Courses** - ✅ Should show 4 courses
3. **Course Details** - ✅ Click any course, should show prerequisites and next steps
4. **Admin Login** - ✅ Go to `/admin/login`, login with `admin` / `admin123`
5. **Admin Dashboard** - ✅ Should show all courses and management options

## Step 8: Configure Custom Domain (Optional)

1. In Vercel project, go to "Settings" → "Domains"
2. Add domain: `pathway.psitlab.com`
3. Follow Vercel's DNS configuration instructions
4. Add DNS records in your domain provider:
   - Type: `CNAME`
   - Name: `pathway`
   - Value: `cname.vercel-dns.com`
5. Wait for DNS propagation (5-30 minutes)

## Troubleshooting

### Build Fails with "pnpm lockfile mismatch"
- This shouldn't happen with the clean package.json
- If it does, check that `patchedDependencies` is NOT in package.json

### 404 Error on Deployment
- Check that `dist/index.js` was created during build
- Verify `vercel.json` routes are correct

### Database Connection Error
- Verify `DATABASE_URL` environment variable is set correctly
- Check Supabase database is running
- Ensure SSL mode is enabled in connection string

### Admin Login Not Working
- Verify admin user exists in database
- Check JWT_SECRET is set in environment variables
- Try resetting admin password in database

## Expected File Structure

Your project should have:

```
perscholas-pathway/
├── client/              # React frontend
├── server/              # Express backend
├── drizzle/             # Database schema
├── shared/              # Shared types
├── package.json         # Dependencies (NO patchedDependencies)
├── pnpm-lock.yaml       # Lock file (regenerated without patches)
├── vercel.json          # Vercel configuration
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── DEPLOYMENT_README.md # Deployment docs
```

## Success Criteria

✅ Build completes without errors
✅ Homepage loads with Per Scholas branding
✅ Courses display correctly
✅ Admin login works
✅ Database queries work
✅ All features functional

## Support

If deployment fails, check:
1. Vercel build logs for specific errors
2. Browser console for frontend errors
3. Vercel function logs for backend errors

