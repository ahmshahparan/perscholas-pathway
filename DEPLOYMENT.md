# Deployment Guide: Per Scholas Training Pathway

This guide walks you through deploying the Per Scholas Training Pathway application to Vercel with Supabase as the database.

## Prerequisites

- Vercel account ([sign up at vercel.com](https://vercel.com))
- Supabase account ([sign up at supabase.com](https://supabase.com))
- GitHub account (for connecting your repository to Vercel)

## Part 1: Set Up Supabase Database

### 1.1 Create a New Supabase Project

1. Log in to [Supabase](https://supabase.com)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: perscholas-pathway (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"** and wait for provisioning (2-3 minutes)

### 1.2 Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **"URI"** mode
4. Copy the connection string (it looks like this):
   ```
   mysql://[user]:[password]@[host]:3306/[database]
   ```
5. Replace `[password]` with your actual database password
6. **Save this connection string** - you'll need it for Vercel

### 1.3 Configure Database for MySQL Compatibility

The application uses MySQL/TiDB dialect. If using Supabase PostgreSQL, you'll need to:

**Option A: Use TiDB Cloud (Recommended for MySQL compatibility)**
1. Sign up at [tidbcloud.com](https://tidbcloud.com)
2. Create a free Serverless Tier cluster
3. Get the MySQL connection string from the cluster details
4. Use this connection string instead of Supabase

**Option B: Adapt to PostgreSQL**
If you prefer to use Supabase PostgreSQL:
1. Update `drizzle.config.ts` to use PostgreSQL driver
2. Update schema imports to use `pg-core` instead of `mysql-core`
3. Adjust data types in `drizzle/schema.ts` accordingly

## Part 2: Deploy to Vercel

### 2.1 Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/perscholas-pathway.git
   git push -u origin main
   ```

### 2.2 Import Project to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `dist` (or leave default)

### 2.3 Configure Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Variables:

```env
# Database Connection
DATABASE_URL=mysql://[user]:[password]@[host]:3306/[database]

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OAuth Configuration (if using Manus OAuth, otherwise can use dummy values)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Admin

# App Configuration
VITE_APP_TITLE=Per Scholas Training Pathway
VITE_APP_LOGO=/logo.png

# Built-in API Configuration (optional, for Manus platform features)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

#### How to Generate JWT_SECRET:

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, Vercel will provide you with a URL (e.g., `https://perscholas-pathway.vercel.app`)

## Part 3: Initialize Database

### 3.1 Run Database Migrations

After the first deployment, you need to create the database tables:

**Option A: Run locally and push to production database**
```bash
# Make sure DATABASE_URL points to your production database
export DATABASE_URL="mysql://[user]:[password]@[host]:3306/[database]"
pnpm db:push
```

**Option B: Use Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migration
vercel env pull .env.local
pnpm db:push
```

### 3.2 Seed Initial Data

Run the seed script to create admin users and sample courses:

```bash
# Make sure DATABASE_URL is set
npx tsx scripts/seed.ts
```

This will create:
- 5 admin users: `admin-global`, `admin-it`, `admin-se`, `admin-manuops`, `admin-misc`
- Default password: `perscholas2024`
- Sample courses with pathways

## Part 4: Verify Deployment

### 4.1 Test Public Pages

1. Visit your Vercel URL
2. Click **"Browse Courses"** to see the course catalog
3. Click on a course to view details, prerequisites, and next steps

### 4.2 Test Admin Interface

1. Click **"Admin Login"**
2. Login with:
   - Username: `admin-global`
   - Password: `perscholas2024`
3. Test creating a new course
4. Test creating a pathway between courses
5. Test deleting a course

### 4.3 Verify Bidirectional Relationships

1. Create a pathway from Course A → Course B
2. View Course A: should show Course B in "Available Next Steps"
3. View Course B: should show Course A in "Prerequisites"
4. Confirm automatic bidirectional syncing works

## Part 5: Post-Deployment Configuration

### 5.1 Change Default Admin Passwords

**Important**: Change the default password for security!

1. Connect to your database directly (using Supabase SQL Editor or MySQL client)
2. Update admin passwords:
   ```sql
   -- Generate a new bcrypt hash for your password
   -- Use an online bcrypt generator or Node.js:
   -- node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"
   
   UPDATE admin_users 
   SET password_hash = '$2a$10$YOUR_NEW_BCRYPT_HASH'
   WHERE username = 'admin-global';
   ```

### 5.2 Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

### 5.3 Set Up SSL (Automatic)

Vercel automatically provides SSL certificates for all deployments. No configuration needed!

## Troubleshooting

### Build Fails on Vercel

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify `DATABASE_URL` is accessible from Vercel's servers

### Database Connection Errors

- Verify `DATABASE_URL` format is correct
- Check that your database allows connections from Vercel's IP addresses
- For Supabase: Enable "Connection Pooling" in database settings
- For TiDB: Ensure SSL is properly configured

### Admin Login Not Working

- Verify JWT_SECRET is set in Vercel environment variables
- Check that seed script ran successfully
- Verify admin users exist in the database:
  ```sql
  SELECT * FROM admin_users;
  ```

### Courses Not Showing

- Verify database migrations ran successfully
- Check that seed data was inserted
- Look for errors in Vercel function logs

## Maintenance

### Adding New Courses

Use the admin interface at `/admin/dashboard` to:
- Create new courses
- Edit existing courses
- Create pathways between courses
- Soft-delete courses (removes from pathways but keeps in database)

### Database Backups

- **Supabase**: Automatic daily backups (check Settings → Database → Backups)
- **TiDB Cloud**: Automatic backups with point-in-time recovery

### Monitoring

- **Vercel Analytics**: Enable in project settings for traffic insights
- **Database Monitoring**: Use Supabase/TiDB dashboard for query performance
- **Error Tracking**: Check Vercel function logs for runtime errors

## Support

For issues with:
- **Vercel Deployment**: [Vercel Documentation](https://vercel.com/docs)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **TiDB Cloud**: [TiDB Documentation](https://docs.pingcap.com/tidbcloud)

## Security Checklist

- [ ] Changed default admin passwords
- [ ] Set strong JWT_SECRET
- [ ] DATABASE_URL contains strong password
- [ ] Environment variables are set in Vercel (not in code)
- [ ] Database allows connections only from Vercel IPs
- [ ] SSL/TLS enabled for database connections
- [ ] Regular database backups configured

