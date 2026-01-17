#!/bin/bash

# Setup script for LendPro Admin Portal
# This script helps you create the GitHub repo and deploy to Railway

set -e

echo "🚀 LendPro Admin Portal Setup"
echo "=============================="
echo ""

# Check if we're in the admin-portal directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the admin-portal directory"
    exit 1
fi

# Check for required tools
command -v git >/dev/null 2>&1 || { echo "❌ Error: git is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Error: node is required but not installed."; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Step 1: Initialize git
echo "📦 Step 1: Initializing Git repository..."
if [ -d ".git" ]; then
    echo "⚠️  Git repository already initialized"
else
    git init
    echo "✅ Git repository initialized"
fi
echo ""

# Step 2: Get GitHub username
echo "👤 Step 2: GitHub Configuration"
read -p "Enter your GitHub username: " GITHUB_USER
echo ""

# Step 3: Create .gitignore if not exists
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
node_modules
dist
.env
.env.local
.env.production
*.log
.DS_Store
coverage
.vscode
.idea
*.swp
*.swo
*~
database/migrations/*.sql
EOF
    echo "✅ .gitignore created"
fi
echo ""

# Step 4: Generate encryption key
echo "🔐 Step 4: Generating encryption key..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Encryption key generated"
echo ""
echo "⚠️  IMPORTANT: Save this encryption key securely!"
echo "Encryption Key: $ENCRYPTION_KEY"
echo ""
read -p "Press Enter to continue after you've saved the key..."
echo ""

# Step 5: Commit files
echo "💾 Step 5: Creating initial commit..."
git add .
git commit -m "Initial commit: LendPro Admin Portal

- Admin dashboard for managing clients
- Client creation wizard  
- Railway deployment automation
- Encrypted credential storage
- Analytics and audit logging" || echo "⚠️  No changes to commit"
echo "✅ Initial commit created"
echo ""

# Step 6: Add remote
echo "🔗 Step 6: Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "git@github.com:${GITHUB_USER}/lendpro-admin-portal.git"
echo "✅ GitHub remote added"
echo ""

# Step 7: Push to GitHub
echo "📤 Step 7: Pushing to GitHub..."
echo ""
echo "⚠️  Before pushing, make sure you've created the repository on GitHub:"
echo "   https://github.com/new"
echo "   Repository name: lendpro-admin-portal"
echo "   (Do NOT initialize with README, .gitignore, or license)"
echo ""
read -p "Have you created the repository on GitHub? (y/n): " CREATED_REPO

if [ "$CREATED_REPO" = "y" ] || [ "$CREATED_REPO" = "Y" ]; then
    git branch -M main
    git push -u origin main || echo "⚠️  Push failed. Make sure the repository exists and you have access."
    echo "✅ Pushed to GitHub"
else
    echo "⚠️  Skipping push. Run 'git push -u origin main' after creating the repository."
fi
echo ""

# Step 8: Deploy instructions
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Deploy to Railway:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Click 'New Project' → 'Deploy from GitHub repo'"
echo "   - Select: lendpro-admin-portal"
echo "   - Add MySQL database"
echo "   - Set environment variables:"
echo "     • NODE_ENV=production"
echo "     • PORT=3001"
echo "     • ADMIN_DATABASE_URL=\${{MySQL.DATABASE_URL}}"
echo "     • RAILWAY_API_TOKEN=<get from Railway settings>"
echo "     • ENCRYPTION_KEY=${ENCRYPTION_KEY}"
echo ""
echo "2️⃣  Get Railway API Token:"
echo "   https://railway.app/account/tokens"
echo ""
echo "3️⃣  Read the deployment guide:"
echo "   cat DEPLOY_TO_RAILWAY.md"
echo ""
echo "🔗 GitHub Repo: https://github.com/${GITHUB_USER}/lendpro-admin-portal"
echo ""
echo "📚 For detailed instructions, see: DEPLOY_TO_RAILWAY.md"
echo ""
