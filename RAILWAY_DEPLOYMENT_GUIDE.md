# Railway.app Deployment Guide

## Why Railway?

Railway.app is **perfect** for this project because:
- ✅ Native support for Node.js + Express apps
- ✅ Works seamlessly with PostgreSQL databases
- ✅ Automatic HTTPS and custom domains
- ✅ Simple environment variable management
- ✅ Git-based deployments (like Vercel)
- ✅ No serverless function complexity
- ✅ Free tier available ($5/month credit)

## Prerequisites

- ✅ GitHub account
- ✅ Railway account (sign up at https://railway.app)
- ✅ Supabase PostgreSQL database running
- ✅ Project code pushed to GitHub

## Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. You'll get **$5 free credit per month** (enough for small projects)

## Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `perscholas-pathway`
4. Railway will automatically detect it's a Node.js project

## Step 3: Configure Environment Variables

Click on your service → "Variables" tab → Add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `JWT_SECRET` | `your-super-secret-jwt-key-12345` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

**Note:** Railway automatically provides `PORT` but you can set it explicitly.

## Step 4: Configure Build Settings (Optional)

Railway auto-detects from `package.json`, but you can verify:

**Build Command:** `pnpm build`
**Start Command:** `node dist/index.js`

These are already in your `package.json` scripts, so Railway will use them automatically.

## Step 5: Deploy

1. Click "Deploy"
2. Railway will:
   - Install dependencies (`pnpm install`)
   - Run build (`pnpm build`)
   - Start the server (`node dist/index.js`)
3. Wait 2-3 minutes for deployment

## Step 6: Get Your URL

1. Go to "Settings" tab
2. Scroll to "Domains"
3. Click "Generate Domain"
4. You'll get a URL like: `https://perscholas-pathway-production.up.railway.app`

## Step 7: Test Deployment

Visit your Railway URL and verify:

- ✅ Homepage loads with Per Scholas branding
- ✅ Browse courses shows 4 courses from database
- ✅ Course details page works
- ✅ Admin login works (`admin` / `admin123`)
- ✅ Admin dashboard functions properly

## Step 8: Add Custom Domain (Optional)

1. In Railway project → "Settings" → "Domains"
2. Click "Custom Domain"
3. Enter: `pathway.psitlab.com`
4. Railway will show you DNS records to add:
   - Type: `CNAME`
   - Name: `pathway`
   - Value: `your-app.up.railway.app`
5. Add these records in your DNS provider
6. Wait 5-30 minutes for propagation

## Project Structure (Railway Compatible)

```
perscholas-pathway/
├── client/              # React frontend
├── server/              # Express backend
├── drizzle/             # Database schema
├── dist/                # Build output (generated)
│   ├── index.js        # Express server bundle
│   └── public/         # Static React files
├── package.json         # Dependencies & scripts
├── railway.json         # Railway configuration
├── nixpacks.toml        # Build configuration
└── pnpm-lock.yaml       # Lock file
```

## How Railway Deploys Your App

1. **Build Phase:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm build  # Runs: vite build && esbuild server
   ```

2. **Start Phase:**
   ```bash
   node dist/index.js  # Starts Express server
   ```

3. **Runtime:**
   - Express serves static files from `dist/public/`
   - Express handles API routes via tRPC
   - Database queries go to Supabase PostgreSQL

## Automatic Deployments

Railway automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detects the push and redeploys automatically (2-3 minutes).

## Monitoring & Logs

1. **View Logs:**
   - Railway dashboard → "Deployments" → Click latest deployment
   - See real-time logs

2. **Metrics:**
   - CPU usage
   - Memory usage
   - Request count

3. **Health Checks:**
   - Railway automatically monitors your app
   - Restarts if it crashes

## Cost Estimate

**Free Tier:** $5/month credit
- Typical usage: $3-4/month for small traffic
- Includes: 512MB RAM, shared CPU
- **You'll stay within free tier for development/testing**

**Paid Tier:** Pay-as-you-go after free credit
- ~$0.000463/GB-hour for RAM
- ~$0.000231/vCPU-hour for CPU

## Troubleshooting

### Build Fails

**Check build logs in Railway dashboard**

Common issues:
- Missing environment variables → Add in Variables tab
- pnpm lockfile issues → Push updated `pnpm-lock.yaml`
- Build timeout → Contact Railway support (rare)

### App Crashes on Start

**Check deployment logs**

Common issues:
- `DATABASE_URL` not set → Add environment variable
- Port binding issue → Railway sets `PORT` automatically
- Missing dependencies → Verify `package.json`

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check Supabase database is running
- Ensure SSL mode is enabled: `?sslmode=require`

### 404 Errors

- Verify build completed successfully
- Check `dist/public/index.html` exists
- Ensure Express static middleware is configured

## Advantages Over Vercel

| Feature | Railway | Vercel |
|---------|---------|--------|
| Express Support | ✅ Native | ❌ Requires serverless functions |
| PostgreSQL | ✅ Easy | ⚠️ Complex |
| WebSockets | ✅ Supported | ❌ Limited |
| Long-running processes | ✅ Yes | ❌ 10s timeout |
| Configuration | ✅ Simple | ⚠️ Complex for full-stack |
| Pricing | ✅ $5/mo free | ✅ Free tier |

## Next Steps After Deployment

1. **Test all features thoroughly**
2. **Change admin password** (currently `admin123`)
3. **Add custom domain**
4. **Set up monitoring/alerts**
5. **Configure backups** (Supabase handles this)
6. **Update `JWT_SECRET`** to a strong random value

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## Success Checklist

- ✅ Railway project created
- ✅ GitHub repo connected
- ✅ Environment variables set
- ✅ Build completes successfully
- ✅ App starts without errors
- ✅ Homepage loads
- ✅ Database queries work
- ✅ Admin login functions
- ✅ Custom domain configured (optional)

**Your app should be live and working perfectly on Railway!** 🚀

