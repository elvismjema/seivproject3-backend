# AWS Deployment Guide - SEIV Project 3 Backend

## Team 2 Deployment Instructions

### Prerequisites on AWS EC2 Instance
```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js (v16 or later)
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -  # Amazon Linux
sudo yum install -y nodejs

# OR for Ubuntu
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MySQL
sudo yum install -y mysql-server  # Amazon Linux
# OR
sudo apt install -y mysql-server  # Ubuntu

# Start MySQL
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### Step 1: Clone Repository on AWS
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone the backend repository
cd /home/ec2-user
git clone https://github.com/elvismjema/seivproject3-backend.git
cd seivproject3-backend
```

### Step 2: Install Dependencies
```bash
npm install --production
```

### Step 3: Configure Environment Variables
```bash
# Create .env file with production settings
cat > .env << 'EOF'
# Google OAuth Configuration
CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
CLIENT_SECRET=your-google-client-secret-here

# Database Configuration (UPDATE THESE FOR AWS RDS OR LOCAL MYSQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PW=your-secure-password-here
DB_NAME=tutorial

# Server Configuration
PORT=3100
NODE_ENV=production
EOF
```

### Step 4: Set Up MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE tutorial;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'your-secure-password-here';
GRANT ALL PRIVILEGES ON tutorial.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Initialize Database Tables
```bash
# Run the application once to create tables (Sequelize will auto-create)
node server.js

# Press Ctrl+C after tables are created
```

### Step 6: Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status
pm2 logs seivproject3-backend
```

### Step 7: Configure Nginx as Reverse Proxy (Optional but Recommended)
```bash
# Install Nginx
sudo yum install -y nginx  # Amazon Linux
# OR
sudo apt install -y nginx  # Ubuntu

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/seivproject3-backend.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 8: Configure AWS Security Group
Make sure your EC2 security group allows:
- **Inbound**: Port 22 (SSH), Port 80 (HTTP), Port 443 (HTTPS), Port 3100 (if accessing directly)
- **Outbound**: All traffic

### Useful PM2 Commands
```bash
# View logs
pm2 logs seivproject3-backend

# Restart application
pm2 restart seivproject3-backend

# Stop application
pm2 stop seivproject3-backend

# Monitor
pm2 monit

# View detailed info
pm2 info seivproject3-backend
```

### Environment Variables for Production

Update `.env` file with production values:
```bash
# Database - Use AWS RDS endpoint if using RDS
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PW=strong-password-here
DB_NAME=tutorial

# Google OAuth - Update redirect URIs in Google Console
# Add: http://your-ec2-ip/oauth/callback
# Add: https://your-domain.com/oauth/callback

PORT=3100
NODE_ENV=production
```

### Troubleshooting

#### Check if app is running
```bash
pm2 status
curl http://localhost:3100
```

#### Check logs
```bash
pm2 logs seivproject3-backend --lines 100
```

#### Check database connection
```bash
mysql -u admin -p tutorial
```

#### Restart everything
```bash
pm2 restart seivproject3-backend
sudo systemctl restart nginx
```

### Database Migration/Seed (if needed)
```bash
# Export from local
mysqldump -u root tutorial > tutorial_backup.sql

# Import to AWS (from local machine)
scp -i your-key.pem tutorial_backup.sql ec2-user@your-ec2-ip:/home/ec2-user/

# On AWS, import
mysql -u admin -p tutorial < /home/ec2-user/tutorial_backup.sql
```

### SSL Certificate (Production)
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# OR
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### Monitoring
```bash
# Set up PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Quick Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash
git pull origin main
npm install --production
pm2 restart seivproject3-backend
pm2 logs seivproject3-backend --lines 50
```

Make executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```
