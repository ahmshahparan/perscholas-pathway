# Quick Start: Fresh Vercel Deployment

## ✅ Pre-Deployment Checklist

**Database Status:**
- ✅ Supabase PostgreSQL running
- ✅ Database seeded with sample data
- ✅ Admin user created (username: `admin`, password: `admin123`)

**Files Ready:**
- ✅ Clean project package (no node_modules, no .git, no patches)
- ✅ PostgreSQL schema (not MySQL)
- ✅ pnpm-lock.yaml (without patchedDependencies)
- ✅ vercel.json configured
- ✅ package.json with engines field

## 🚀 Deployment Steps (5 minutes)

### 1. Extract ZIP
```bash
unzip perscholas-pathway-CLEAN.zip
cd perscholas-pathway-clean
```

### 2. Create GitHub Repo
- Go to: https://github.com/new
- Name: `perscholas-pathway`
- Visibility: Private
- **Don't** initialize with anything
- Click "Create repository"

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/perscholas-pathway.git
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel
- Go to: https://vercel.com/new
- Import your GitHub repo
- **Add Environment Variables:**
  - `DATABASE_URL` = `postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
  - `JWT_SECRET` = `your-super-secret-jwt-key-12345`
  - `NODE_ENV` = `production`
- Click "Deploy"

### 5. Test Deployment
- Visit your Vercel URL
- Test homepage ✅
- Test course catalog ✅
- Test admin login (`admin` / `admin123`) ✅

## 🔧 Configuration Files

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

**package.json (key sections):**
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## 📊 What Gets Built

```
dist/
├── index.js          ← Express server (63KB)
└── public/
    ├── index.html    ← React app (366KB)
    └── assets/
        ├── index-*.css  (133KB)
        └── index-*.js   (1MB)
```

## 🎯 Success Indicators

✅ Build completes in 2-3 minutes
✅ No pnpm lockfile errors
✅ No "NOT_FOUND" errors
✅ Homepage shows Per Scholas logo
✅ Courses load from database
✅ Admin login works

## ⚠️ Common Issues (SOLVED)

❌ **pnpm lockfile mismatch** → FIXED: Removed patchedDependencies
❌ **404 NOT_FOUND** → FIXED: Correct vercel.json routing
❌ **.npmrc error** → FIXED: Removed .npmrc, added engines field
❌ **Raw code showing** → FIXED: Proper build configuration

## 📞 Need Help?

If deployment fails:
1. Check Vercel build logs
2. Verify environment variables are set
3. Ensure DATABASE_URL is correct
4. Test build locally: `pnpm install && pnpm build`

## 🌐 Custom Domain

After successful deployment, add custom domain:
1. Vercel → Settings → Domains
2. Add `pathway.psitlab.com`
3. Configure DNS: CNAME → `cname.vercel-dns.com`
4. Wait 5-30 minutes for propagation

