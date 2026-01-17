# Quick Fix: Add MySQL Database to Admin Portal

Your admin portal deployment is failing because it needs a MySQL database.

## Steps to Fix

### 1. Add MySQL Database to Railway Project

1. Go to your Railway project: https://railway.app/dashboard
2. Click on your `lendpro-admin-portal` project
3. Click **"+ New"** (top right)
4. Select **"Database"**
5. Choose **"Add MySQL"**
6. Wait for provisioning (~30 seconds)

### 2. Link Database to Web Service

1. Click on your **web service** (lendpro-admin-portal)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. For the Name field, enter: `ADMIN_DATABASE_URL`
5. For the Value field, click **"Add Reference"**
6. Select the **MySQL** service
7. Choose **`DATABASE_URL`** from the dropdown
8. Click **"Add"**

### 3. Add Other Required Environment Variables

While in the Variables tab, also add:

```
NODE_ENV = production
PORT = 3001
```

### 4. Add Railway API Token (for deploying clients)

1. Go to https://railway.app/account/tokens
2. Click **"Create Token"**
3. Copy the token
4. Back in your project Variables tab, add:
   ```
   RAILWAY_API_TOKEN = your_token_here
   ```

### 5. Add Encryption Key (for storing credentials)

Run this command locally to generate a secure key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it as:

```
ENCRYPTION_KEY = your_hex_key_here
```

### 6. Trigger Redeploy

Railway should automatically redeploy when you add the variables. If not:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment

## Expected Result

After adding the database and variables, the deployment should succeed and you'll see:

```
✓ Database migrations applied
[Admin Portal] Server running on port 3001
```

Your admin portal will be accessible at: `https://your-service.up.railway.app`

## Verify It's Working

Check the health endpoint:

```bash
curl https://your-service.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "admin-portal"
}
```
