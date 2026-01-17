# Deployment Checklist

Use this checklist to ensure successful deployment of the admin portal.

## Pre-Deployment

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Git installed and configured
- [ ] GitHub account created
- [ ] Railway account created (https://railway.app)

## Local Setup

- [ ] Navigate to admin-portal directory
- [ ] Run `./setup.sh` (or manually initialize git)
- [ ] Save encryption key securely (64-char hex)
- [ ] Create GitHub repository: `lendpro-admin-portal`
- [ ] Push code to GitHub

## Railway Setup

### Project Creation
- [ ] Create new Railway project
- [ ] Connect GitHub repository
- [ ] Initial deployment triggered

### Database
- [ ] MySQL database added to project
- [ ] Database is provisioned (green status)
- [ ] `DATABASE_URL` variable exists in MySQL service

### Environment Variables (web service)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `ADMIN_DATABASE_URL` linked to MySQL
- [ ] `RAILWAY_API_TOKEN` added (from Railway account)
- [ ] `ENCRYPTION_KEY` added (from setup script)

### Deployment
- [ ] Build completed successfully
- [ ] Deployment shows "Active" status
- [ ] No errors in deployment logs

## Post-Deployment Verification

### Health Check
- [ ] Visit: `https://your-url.up.railway.app/api/health`
- [ ] Returns: `{"status":"ok",...}`
- [ ] Response time < 500ms

### Database
- [ ] Migrations ran automatically (check logs for "db:migrate")
- [ ] Or manually run: `railway run npm run db:migrate`
- [ ] No database connection errors in logs

### Admin Portal Access
- [ ] Can access dashboard at Railway URL
- [ ] Dashboard loads without errors
- [ ] No console errors in browser

### Functionality Test
- [ ] Click "New Client" button
- [ ] Form renders correctly
- [ ] Can fill in all fields
- [ ] No errors when typing

## Create Test Client

- [ ] Fill in test client information
- [ ] Use real LendPro credentials
- [ ] Click "Create Client"
- [ ] Client appears in dashboard with "inactive" status
- [ ] Click "Deploy" button
- [ ] Deployment starts (status changes to "deploying")
- [ ] Wait 3-5 minutes
- [ ] Client status changes to "active"
- [ ] Service URL is visible
- [ ] Can visit client's Railway URL
- [ ] Client site loads successfully

## Optional: Custom Domain

- [ ] Add custom domain in Railway (Settings → Networking)
- [ ] Configure DNS CNAME record
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Verify custom domain works
- [ ] SSL certificate auto-provisioned

## Security Checklist

- [ ] Encryption key saved securely (password manager)
- [ ] Railway API token saved securely
- [ ] 2FA enabled on Railway account
- [ ] 2FA enabled on GitHub account
- [ ] `.env` files NOT committed to git
- [ ] `.gitignore` includes `.env*`

## Monitoring Setup

- [ ] Railway alerts configured (optional)
- [ ] Health check endpoint tested
- [ ] Uptime monitoring configured (optional)
- [ ] Log aggregation set up (optional)

## Documentation

- [ ] README.md reviewed
- [ ] DEPLOY_TO_RAILWAY.md read
- [ ] Environment variables documented
- [ ] Recovery procedures documented
- [ ] Team members have access

## Backup Strategy

- [ ] Database backup schedule planned
- [ ] Encryption key backed up securely
- [ ] Client configs exported
- [ ] Recovery tested

## Performance Checks

- [ ] Dashboard loads in < 2 seconds
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks in logs

## Common Issues - Troubleshooting

### Build Fails
- [ ] Check package.json scripts
- [ ] Verify Node.js version
- [ ] Review build logs
- [ ] Check for missing dependencies

### Database Connection Error  
- [ ] Verify `ADMIN_DATABASE_URL` is set
- [ ] Check MySQL service status (green)
- [ ] Test connection: `railway run npm run db:migrate`
- [ ] Review database logs

### Deployment Success but Site Won't Load
- [ ] Check server logs: `railway logs --tail`
- [ ] Verify health endpoint: `/api/health`
- [ ] Check port binding (should be 0.0.0.0)
- [ ] Verify static files built correctly

### Client Deployment Fails
- [ ] Check Railway API token is valid
- [ ] Verify client configuration
- [ ] Review Railway API quotas
- [ ] Check LendPro credentials

## Production Readiness

- [ ] All critical paths tested
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Monitoring in place
- [ ] Backup strategy implemented
- [ ] Recovery procedures tested
- [ ] Team trained on system
- [ ] Documentation complete

## Sign-Off

**Deployed by:** ________________  
**Date:** ________________  
**Environment:** Production  
**Railway Project:** ________________  
**GitHub Repo:** https://github.com/YOUR_USERNAME/lendpro-admin-portal  

**Admin Portal URL:** ________________  
**Database:** MySQL on Railway  
**Status:** ⬜ Deployed ⬜ Verified ⬜ In Production  

## Notes

______________________________________________________
______________________________________________________
______________________________________________________
______________________________________________________

---

**Next Review Date:** ________________  
**Responsible Party:** ________________
