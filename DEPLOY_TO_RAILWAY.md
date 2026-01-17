# Deploying Admin Portal to Railway

Follow these steps to deploy the LendPro Admin Portal to Railway.

## Step 1: Create GitHub Repository

### Option A: Via GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `lendpro-admin-portal`
3. Description: "Admin portal for managing LendPro client deployments"
4. Choose Public or Private
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Option B: Via GitHub CLI

```bash
cd "/Users/jameshamilton/lendpro visualizer /lendpro-ecommerce/admin-portal"
gh repo create lendpro-admin-portal --public --source=. --remote=origin
```

## Step 2: Initialize Git and Push

```bash
cd "/Users/jameshamilton/lendpro visualizer /lendpro-ecommerce/admin-portal"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: LendPro Admin Portal

- Admin dashboard for managing clients
- Client creation wizard
- Railway deployment automation
- Encrypted credential storage
- Analytics and audit logging"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin git@github.com:YOUR_USERNAME/lendpro-admin-portal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### Via Railway Dashboard (Recommended)

1. **Go to Railway** - https://railway.app/dashboard

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select `lendpro-admin-portal` repository
   - Click "Deploy Now"

3. **Add MySQL Database**
   - In your project, click "+ New"
   - Select "Database"
   - Choose "MySQL"
   - Wait for provisioning (~30 seconds)

4. **Set Environment Variables**
   - Click on the "web" service
   - Go to "Variables" tab
   - Add the following variables:

   ```
   NODE_ENV = production
   PORT = 3001
   ```

5. **Link Database**
   - Add variable: `ADMIN_DATABASE_URL`
   - Click "Reference" → Select MySQL → Choose `DATABASE_URL`
   - Or manually: `${{MySQL.DATABASE_URL}}`

6. **Add Railway API Token**
   - Go to https://railway.app/account/tokens
   - Click "Create Token"
   - Copy the token
   - Back in your project, add variable:
     ```
     RAILWAY_API_TOKEN = your_token_here
     ```

7. **Generate and Add Encryption Key**
   - Run locally:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output (64-character hex string)
   - Add variable:
     ```
     ENCRYPTION_KEY = your_hex_key_here
     ```

8. **Trigger Deployment**
   - Railway will automatically deploy
   - Watch the build logs
   - Wait for "Deployment successful" (~3-5 minutes)

9. **Get Your URL**
   - Click "Settings" → "Networking"
   - Your app will be at: `https://your-service.up.railway.app`
   - Optionally add a custom domain

### Via Railway CLI

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize in admin-portal directory
cd "/Users/jameshamilton/lendpro visualizer /lendpro-ecommerce/admin-portal"
railway init

# Add MySQL database
railway add --name mysql

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set RAILWAY_API_TOKEN=your_token_here
railway variables set ENCRYPTION_KEY=your_hex_key_here

# Link database (Railway will prompt you)
railway variables set ADMIN_DATABASE_URL='${{MySQL.DATABASE_URL}}'

# Deploy
railway up

# Open in browser
railway open
```

## Step 4: Initialize Database

After deployment completes:

### Option A: Via Railway CLI

```bash
railway run npm run db:migrate
```

### Option B: Automatic (Recommended)

The `railway.toml` is configured to run migrations on startup:
```toml
startCommand = "npm run db:migrate && npm start"
```

This means migrations run automatically on every deployment.

## Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-service.up.railway.app/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-17T...",
     "service": "admin-portal"
   }
   ```

2. **Open in Browser**
   - Go to your Railway URL
   - You should see the admin dashboard
   - Try creating a test client

## Step 6: Add Custom Domain (Optional)

1. In Railway project, go to "Settings" → "Networking"
2. Click "Custom Domain"
3. Enter your domain: `admin.yourdomain.com`
4. Add the CNAME record to your DNS:
   ```
   Type: CNAME
   Name: admin
   Value: your-service.up.railway.app
   ```
5. Wait for DNS propagation (5-30 minutes)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ADMIN_DATABASE_URL` | Yes | MySQL connection | `${{MySQL.DATABASE_URL}}` |
| `RAILWAY_API_TOKEN` | Yes | Railway API token | From Railway dashboard |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key | Generate with crypto |
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | No | Server port | `3001` (default) |

## Troubleshooting

### Build Fails

**Check package.json scripts:**
- Build command should be: `vite build && esbuild ...`
- Start command should be: `npm start`

**Check Railway build logs:**
- Look for missing dependencies
- Verify Node.js version (18+)

### Database Connection Error

**Verify DATABASE_URL:**
```bash
railway run echo $ADMIN_DATABASE_URL
```

Should show MySQL connection string.

**Test connection:**
```bash
railway run npm run db:push
```

### Deployment Succeeds but Site Won't Load

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing environment variables
- Database not migrated
- Port binding issues (use 0.0.0.0)

### "Deployment successful" but /api/health fails

**Check if server is running:**
```bash
railway logs --tail
```

Look for: `[Admin Portal] Server running on...`

**Verify health check path:**
Should be: `/api/health` (not `/health`)

## Next Steps

After successful deployment:

1. **Create Your First Client**
   - Use the web UI or CLI
   - Deploy the client to Railway
   - Test the deployment

2. **Set Up Monitoring**
   - Configure Railway alerts
   - Set up uptime monitoring (UptimeRobot, etc.)
   - Review logs regularly

3. **Security**
   - Enable 2FA on Railway account
   - Rotate encryption key periodically
   - Review audit logs

4. **Backup**
   - Set up automated database backups
   - Export client configs regularly
   - Document recovery procedures

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issues in your repo

## Success! 🎉

Your admin portal is now live! You can manage multiple LendPro clients from one dashboard.

**Admin Portal:** https://your-service.up.railway.app
**GitHub Repo:** https://github.com/YOUR_USERNAME/lendpro-admin-portal
