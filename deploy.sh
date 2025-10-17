#!/bin/bash

echo "======================================"
echo "SEIV Project 3 - Backend Deployment"
echo "======================================"

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Restart PM2 application
echo "🔄 Restarting application with PM2..."
pm2 restart seivproject3-backend

# Show logs
echo "📋 Showing recent logs..."
pm2 logs seivproject3-backend --lines 50 --nostream

echo "✅ Deployment complete!"
echo "Run 'pm2 logs seivproject3-backend' to view live logs"
