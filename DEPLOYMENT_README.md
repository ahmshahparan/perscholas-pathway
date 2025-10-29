# Per Scholas Training Pathway Manager - Deployment Guide

## Quick Start - Deploy to Vercel in 20 Minutes

This guide will help you deploy your Per Scholas Training Pathway Manager to Vercel with your custom domain `pathway.psitlab.com`.

---

## Prerequisites

✅ **Already Completed:**
- ✅ Supabase PostgreSQL database is set up and running
- ✅ Database tables created and seeded with sample data  
- ✅ Application tested locally and working
- ✅ Admin user created (username: `admin`, password: `admin123`)

📋 **You'll Need:**
- GitHub account
- Vercel account (free tier is fine)
- Your Supabase credentials (provided below)
- 20 minutes of time

---

## Step 1: Download Project Files (2 minutes)

1. In the Manus Management UI, click the **Code** tab
2. Click **Download All Files** button  
3. Extract the ZIP file to a folder on your computer
4. You should see folders like `client/`, `server/`, `drizzle/`, etc.

---

## Step 2: Create GitHub Repository (3 minutes)

### 2.1 Create Repository on GitHub

1. Go to https://github.com/new
2. Fill in the details:
   - **Repository name:** `perscholas-pathway`
   - **Description:** Per Scholas Training Pathway Manager
   - **Visibility:** Private (recommended)
   - **DO NOT** check "Initialize with README"
3. Click **Create repository**

### 2.2 Push Code to GitHub

Open terminal/command prompt in your extracted project folder:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Per Scholas Training Pathway Manager"

# Set main branch
git branch -M main

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/perscholas-pathway.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username.

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click **Sign Up** (or **Log In** if you have an account)
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### 3.2 Import Project

1. On Vercel dashboard, click **Add New** → **Project**
2. Find your `perscholas-pathway` repository in the list
3. Click **Import**

### 3.3 Configure Build Settings

Vercel should auto-detect the settings, but verify these:

- **Framework Preset:** Vite
- **Root Directory:** `./` (leave as default)
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install`

### 3.4 Add Environment Variables

Click **Environment Variables** section and add these **EXACTLY as shown**:

#### Variable 1: DATABASE_URL
```
DATABASE_URL
```
Value:
```
postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

#### Variable 2: JWT_SECRET
```
JWT_SECRET
```
Value (generate a random 32+ character string):
```
perscholas-jwt-secret-2025-change-this-to-random-string-min-32-chars
```

**⚠️ IMPORTANT:** Change the JWT_SECRET to a unique random string for security!

#### Variable 3: NODE_ENV
```
NODE_ENV
```
Value:
```
production
```

#### Variable 4: VITE_APP_TITLE
```
VITE_APP_TITLE
```
Value:
```
Per Scholas Training Pathway
```

#### Variable 5: VITE_APP_LOGO
```
VITE_APP_LOGO
```
Value:
```
/perscholas-logo.png
```

**Make sure to select "Production", "Preview", and "Development" for all variables!**

### 3.5 Deploy

1. Click **Deploy** button
2. Wait 2-4 minutes for the build to complete
3. You'll see "Congratulations!" when deployment succeeds
4. Click **Visit** to see your deployed site

---

## Step 4: Configure Custom Domain (5 minutes)

### 4.1 Add Domain to Vercel

1. In your Vercel project dashboard, click **Settings**
2. Click **Domains** in the left sidebar
3. In the "Add Domain" field, enter: `pathway.psitlab.com`
4. Click **Add**

### 4.2 Configure DNS

Vercel will show you DNS configuration instructions. You need to add a **CNAME record** in your DNS provider:

**Type:** CNAME  
**Name:** pathway  
**Value:** cname.vercel-dns.com  
**TTL:** 3600 (or default)

**Where to add this:**
- Go to your domain registrar (where you bought psitlab.com)
- Find DNS settings or DNS management
- Add the CNAME record as shown above
- Save changes

**DNS propagation takes 5-30 minutes.** After that, `pathway.psitlab.com` will point to your Vercel deployment!

---

## Step 5: Test Your Deployment (2 minutes)

### 5.1 Test Public Site

1. Visit your Vercel URL (e.g., `https://perscholas-pathway.vercel.app`)
2. Or visit `https://pathway.psitlab.com` (after DNS propagates)
3. Click **Browse Courses**
4. You should see 4 sample courses:
   - IT Support Fundamentals
   - Full Stack Development
   - Network Administration
   - Certified Ethical Hacker (CEH)

### 5.2 Test Admin Dashboard

1. Navigate to `/admin` (e.g., `https://pathway.psitlab.com/admin`)
2. Log in with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Test creating/editing courses, domains, pathways, and job roles

---

## Post-Deployment Tasks

### ✅ Change Admin Password (IMPORTANT!)

1. Log in to admin dashboard
2. Go to **User Management** (click the user icon in top right)
3. Click the edit icon next to the admin user
4. Set a strong new password
5. Save changes

### ✅ Add Your Courses

1. In admin dashboard, go to **Courses** tab
2. Click **Create Course**
3. Fill in:
   - Course ID (e.g., CRS-001)
   - Course Name
   - Course Type (Immersive or Career Accelerator)
   - Objectives
   - Duration (weeks)
   - Certifications/Badges
   - Domain
   - Primary and Secondary Job Roles
4. Click **Create**
5. Repeat for all your courses

### ✅ Add More Admin Users

1. Go to **User Management**
2. Click **Add Admin User**
3. Fill in username, email, password
4. Select role:
   - **Global Admin:** Can modify all content
   - **Admin:** Can only modify content they created
5. Click **Create**

### ✅ Customize Domains

1. In admin dashboard, click **Manage Domains**
2. Edit existing domains or add new ones:
   - Software Engineering
   - Cybersecurity
   - Data Science & Analytics
   - IT Support
   - Cloud Computing
   - etc.

---

## Troubleshooting

### Build Fails on Vercel

**Check:**
- Environment variables are set correctly
- All variables are selected for "Production"
- DATABASE_URL has no extra spaces or line breaks

**Fix:**
- Go to Settings → Environment Variables
- Verify each variable
- Redeploy: Deployments → ⋯ → Redeploy

### Database Connection Error

**Symptoms:** Courses page is empty, 500 errors in console

**Check:**
- DATABASE_URL is correct
- Supabase database is running
- Connection string includes `?sslmode=require`

**Fix:**
- Verify DATABASE_URL in Vercel settings
- Test connection in Supabase dashboard
- Redeploy after fixing

### Admin Login Doesn't Work

**Check:**
- JWT_SECRET is set in Vercel
- Browser cache is cleared
- Using correct credentials (admin/admin123)

**Fix:**
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Verify JWT_SECRET is set in Vercel

### Custom Domain Not Working

**Check:**
- DNS CNAME record is added correctly
- DNS has propagated (use https://dnschecker.org)
- Vercel shows domain as "Valid"

**Fix:**
- Wait 5-30 minutes for DNS propagation
- Verify CNAME points to `cname.vercel-dns.com`
- Check domain status in Vercel → Settings → Domains

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_URL | ✅ Yes | Supabase PostgreSQL connection string | postgres://... |
| JWT_SECRET | ✅ Yes | Secret key for admin authentication tokens | random-32-char-string |
| NODE_ENV | ✅ Yes | Environment mode | production |
| VITE_APP_TITLE | ⚠️ Optional | Application title in header | Per Scholas Training Pathway |
| VITE_APP_LOGO | ⚠️ Optional | Logo image path | /perscholas-logo.png |

---

## Security Checklist

- ✅ Changed default admin password from `admin123`
- ✅ Generated unique JWT_SECRET (not the example one)
- ✅ DATABASE_URL uses SSL (`sslmode=require`)
- ✅ GitHub repository is private
- ✅ Environment variables not committed to Git
- ✅ Only trusted users have admin access

---

## Support & Resources

**Vercel Documentation:** https://vercel.com/docs  
**Supabase Documentation:** https://supabase.com/docs  
**GitHub Documentation:** https://docs.github.com

**Need Help?**
- Check Vercel deployment logs for errors
- Check browser console (F12) for API errors
- Verify all environment variables are set correctly

---

## Success! 🎉

Your Per Scholas Training Pathway Manager is now live at:

**Public Site:** `https://pathway.psitlab.com`  
**Admin Dashboard:** `https://pathway.psitlab.com/admin`

You can now:
- ✅ Add all your courses and programs
- ✅ Manage career outcomes and job roles
- ✅ Create learning pathways
- ✅ Share the site with students and staff

**Next Steps:**
1. Change the admin password
2. Add your actual courses
3. Customize domains and job roles
4. Share the site with your team!

---

**Deployment completed successfully!** If you have any issues, refer to the Troubleshooting section above.

