#!/bin/bash

# Manual Deployment Script for SEIV Project 3 Backend
# Use this when GitHub Actions deployment fails due to network issues

set -e

echo "======================================"
echo "Manual Deployment - SEIV Project 3"
echo "======================================"

# Configuration
REMOTE_HOST="${1:-project2.eaglesoftwareteam.com}"
REMOTE_USER="${2:-ubuntu}"
TARGET_DIR="nodeapps/2025/project3/t2"
SSH_KEY="${3:-./deploy_key_ubuntu_1763614673006}"

echo "🔧 Configuration:"
echo "  Remote Host: $REMOTE_HOST"
echo "  Remote User: $REMOTE_USER"
echo "  Target Dir: $TARGET_DIR"
echo "  SSH Key: $SSH_KEY"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

# Set proper permissions on SSH key
chmod 600 "$SSH_KEY"

# Test SSH connection
echo "🔌 Testing SSH connection..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo "   Please verify:"
    echo "   1. The server is reachable"
    echo "   2. The SSH key is correct"
    echo "   3. Port 22 is open"
    exit 1
fi

# Create deploy directory if it doesn't exist
mkdir -p deploy

# Build the application
echo "📦 Building application..."
npm install
npm run bundle

# Deploy files via rsync
echo "🚀 Deploying files via rsync..."
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    --delete \
    deploy/ \
    "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/"

if [ $? -eq 0 ]; then
    echo "✅ Files deployed successfully"
else
    echo "❌ Rsync failed"
    exit 1
fi

# Execute remote deployment commands
echo "🔄 Executing remote deployment commands..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'EOFREMOTE'
    set -e
    
    TARGET_DIR="nodeapps/2025/project3/t2"
    
    echo "📂 Navigating to $TARGET_DIR..."
    cd "$TARGET_DIR" || exit 1
    
    echo "📦 Installing production dependencies..."
    npm install --production
    
    echo "🛑 Stopping service..."
    sudo systemctl stop tracker-t2-backend || true
    
    echo "📋 Copying systemd service file..."
    sudo cp tracker-t2-backend.service /lib/systemd/system/tracker-t2-backend.service
    
    echo "🔄 Reloading systemd..."
    sudo systemctl daemon-reload
    
    echo "✅ Enabling service..."
    sudo systemctl enable tracker-t2-backend
    
    echo "▶️  Starting service..."
    sudo systemctl start tracker-t2-backend
    
    echo "📊 Checking service status..."
    sudo systemctl status tracker-t2-backend
    
    echo "✅ Deployment completed successfully!"
EOFREMOTE

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Verify the service is running: sudo systemctl status tracker-t2-backend"
echo "2. Check logs: pm2 logs tracker-t2-backend"
echo "3. Test the API: curl https://$REMOTE_HOST/tracker-t2/users"
