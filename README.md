# LendPro Admin Portal

Super admin portal for managing multiple LendPro client deployments on Railway.

## Features

- 🎛️ **Dashboard** - Overview of all client deployments
- ➕ **Client Management** - Create, update, delete clients
- 🚀 **One-Click Deployment** - Deploy clients to Railway with one click
- 🔐 **Secure Credentials** - Encrypted storage of LendPro passwords
- 📊 **Analytics** - Aggregate metrics across all clients
- 🔍 **Audit Logging** - Track all admin actions
- 📈 **Deployment History** - View past deployments and logs

## Prerequisites

- Node.js 18+
- pnpm
- MySQL database
- Railway API token

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
# Database
ADMIN_DATABASE_URL=mysql://user:password@host:3306/lendpro_admin

# Railway API (get from https://railway.app/account/tokens)
RAILWAY_API_TOKEN=your_railway_api_token_here

# Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_char_hex_encryption_key

# Server
NODE_ENV=development
PORT=3001
HOST=localhost
```

### 3. Initialize Database

```bash
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3001 in your browser.

## Deployment to Railway

### Option 1: Deploy via Railway Dashboard

1. Create a new project in Railway
2. Connect this GitHub repository
3. Add a MySQL plugin to the project
4. Set environment variables:
   - `ADMIN_DATABASE_URL` → Reference MySQL plugin
   - `RAILWAY_API_TOKEN` → Your Railway API token
   - `ENCRYPTION_KEY` → Generate with the command above
   - `NODE_ENV=production`
   - `PORT=3001`
5. Deploy!

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to Railway project
railway link

# Add MySQL
railway add

# Set environment variables
railway variables set RAILWAY_API_TOKEN=your_token
railway variables set ENCRYPTION_KEY=your_key
railway variables set NODE_ENV=production

# Deploy
railway up
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ADMIN_DATABASE_URL` | MySQL connection string | Yes | `mysql://user:pass@host:3306/db` |
| `RAILWAY_API_TOKEN` | Railway API token | Yes | Get from Railway dashboard |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting passwords | Yes | Generated with crypto |
| `NODE_ENV` | Environment | Yes | `production` or `development` |
| `PORT` | Server port | No | Default: `3001` |
| `HOST` | Server host | No | Default: `0.0.0.0` |

## Usage

### Creating a Client

1. Click "New Client" in the dashboard
2. Fill in:
   - Client name and domain
   - LendPro credentials (username, password, store ID, sales ID, sales name)
   - Optional: Branding (logo, colors, company name)
   - Optional: Feature flags
3. Click "Create Client"
4. Optionally deploy immediately

### Deploying a Client

1. Find the client in the dashboard
2. Click "Deploy" button
3. Wait for deployment to complete (~2-5 minutes)
4. Client will be available at the Railway URL

### Managing Clients

- **View Details**: Click "Details" on any client card
- **Update Config**: Edit LendPro credentials or branding
- **Redeploy**: Trigger a new deployment
- **Delete**: Remove client and Railway project

## Project Structure

```
admin-portal/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Dashboard, CreateClient, etc.
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/        # Utils and tRPC client
│   │   └── App.tsx
│   └── index.html
├── server/             # Express + tRPC backend
│   ├── router.ts       # API routes
│   ├── crypto.ts       # Encryption utilities
│   └── index.ts        # Server entry point
├── database/           # Database schema and operations
│   ├── schema.ts
│   └── db.ts
└── package.json
```

## API Endpoints

### REST
- `GET /api/health` - Health check

### tRPC
- `clients.list` - Get all clients
- `clients.get` - Get client by ID
- `clients.create` - Create new client
- `clients.deploy` - Deploy client to Railway
- `clients.update` - Update client info
- `clients.updateLendpro` - Update LendPro credentials
- `clients.delete` - Delete client
- `deployments.history` - Get deployment history
- `analytics.client` - Get client analytics
- `analytics.aggregate` - Get aggregate analytics
- `audit.logs` - Get audit logs

## Security

### Password Encryption
- Uses AES-256-GCM encryption
- Unique salt and IV per password
- Key derived with PBKDF2 (100,000 iterations)

### Audit Logging
All admin actions are logged with:
- Action type
- Resource affected
- Timestamp
- IP address
- User agent

### Best Practices
- Never commit `.env` files
- Rotate encryption keys periodically
- Use strong Railway API token
- Enable 2FA on Railway account
- Review audit logs regularly

## Troubleshooting

### Deployment Fails
1. Check Railway build logs
2. Verify environment variables are set
3. Ensure MySQL database is connected
4. Check Railway API token has proper permissions

### Cannot Connect to Database
1. Verify `ADMIN_DATABASE_URL` is correct
2. Check MySQL service is running
3. Test connection: `mysql -h host -u user -p`

### Client Deployment Issues
1. Check Railway API token
2. Verify client configuration
3. Review deployment logs in Railway
4. Check LendPro credentials are valid

## Development

### Database Migrations

```bash
# Generate migration
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate
```

### Building for Production

```bash
# Build both frontend and backend
pnpm build

# Start production server
pnpm start
```

### Type Checking

```bash
tsc --noEmit
```

## Support

For issues or questions:
1. Check Railway logs
2. Review audit logs in admin portal
3. Check LendPro API status
4. Contact system administrator

## License

MIT
