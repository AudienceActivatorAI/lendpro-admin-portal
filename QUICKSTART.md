# Quick Start: Deploy Admin Portal in 5 Minutes

Follow these steps to get your admin portal running on Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Terminal access

## Step 1: Run Setup Script (1 minute)

```bash
cd "/Users/jameshamilton/lendpro visualizer /lendpro-ecommerce/admin-portal"
./setup.sh
```

This script will:
- Initialize git repository
- Generate encryption key
- Create initial commit
- Set up GitHub remote
- Push to GitHub (after you create the repo)

**Follow the prompts and save your encryption key!**

## Step 2: Create GitHub Repository (30 seconds)

Go to: https://github.com/new

```
Repository name: lendpro-admin-portal
Description: Admin portal for managing LendPro clients
Public or Private: Your choice
✅ Do NOT initialize with README, .gitignore, or license
```

Click "Create repository"

Then continue with the setup script to push your code.

## Step 3: Deploy to Railway (2 minutes)

### 3a. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "**New Project**"
3. Select "**Deploy from GitHub repo**"
4. Choose "**lendpro-admin-portal**"
5. Click "**Deploy Now**"

### 3b. Add MySQL Database

1. In your project, click "**+ New**"
2. Select "**Database**"
3. Choose "**MySQL**"
4. Wait 30 seconds for provisioning

### 3c. Configure Environment Variables

Click on the "**web**" service → "**Variables**" tab

Add these variables:

```bash
NODE_ENV = production
PORT = 3001
```

**Link Database:**
```bash
ADMIN_DATABASE_URL = ${{MySQL.DATABASE_URL}}
```
(Use the "Reference" button to auto-fill this)

**Add Railway API Token:**
1. Get token from: https://railway.app/account/tokens
2. Click "Create Token" → Copy
3. Add variable:
   ```bash
   RAILWAY_API_TOKEN = <paste_token_here>
   ```

**Add Encryption Key:**
```bash
ENCRYPTION_KEY = <paste_key_from_setup_script>
```

## Step 4: Wait for Deployment (2 minutes)

Railway will automatically build and deploy.

Watch the logs:
- "Building..."
- "Deployment successful" ✅

## Step 5: Access Your Admin Portal (10 seconds)

1. Click "**Settings**" → "**Networking**"
2. Your URL: `https://lendpro-admin-portal-production-xxxx.up.railway.app`
3. Click the URL to open

**Test it:**
```bash
curl https://your-url.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","service":"admin-portal"}
```

## Step 6: Create Your First Client (2 minutes)

1. Open the admin portal in your browser
2. Click "**New Client**"
3. Fill in:
   - Client name: "Test Client"
   - Domain: "test.tredfi.com"
   - LendPro credentials:
     - Username: `<your_lendpro_username>`
     - Password: `<your_lendpro_password>`
     - Store ID: `<your_store_id>`
     - Sales ID: `<your_sales_id>`
     - Sales Name: "Test Sales Rep"
4. Click "**Create Client**"
5. Click "**Deploy**" when prompted
6. Wait 3-5 minutes for client deployment

## Done! 🎉

You now have:
- ✅ Admin portal running on Railway
- ✅ MySQL database connected
- ✅ Ready to deploy multiple clients
- ✅ Encrypted credential storage
- ✅ Analytics and monitoring

## Troubleshooting

### Setup script fails
```bash
# Make sure you're in the right directory
cd admin-portal
pwd  # Should show: .../admin-portal

# Make script executable
chmod +x setup.sh
```

### Railway build fails
- Check that all environment variables are set
- Verify DATABASE_URL is linked to MySQL
- Check Railway build logs for errors

### Can't access admin portal
- Verify deployment shows "Active" status
- Check health endpoint: `/api/health`
- Review Railway logs: `railway logs`

### Database migration fails
- Manually run: `railway run npm run db:migrate`
- Check DATABASE_URL format
- Verify MySQL service is running

## Next Steps

1. **Add More Clients**
   - Use the dashboard or CLI
   - Each client gets isolated Railway project

2. **Custom Domain**
   - Settings → Networking → Custom Domain
   - Add: `admin.yourdomain.com`
   - Configure DNS CNAME

3. **Monitoring**
   - Set up Railway alerts
   - Configure uptime monitoring
   - Review analytics regularly

4. **Security**
   - Enable 2FA on Railway
   - Rotate encryption key monthly
   - Review audit logs

## Support

- **Deployment Guide:** See `DEPLOY_TO_RAILWAY.md`
- **Full Documentation:** See `README.md`  
- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway

## Quick Commands

```bash
# View logs
railway logs --tail

# Run migrations
railway run npm run db:migrate

# Open in browser
railway open

# Check environment variables
railway variables

# Redeploy
railway up
```

**Total Time: ~7 minutes** ⏱️

Enjoy managing your LendPro clients! 🚀
