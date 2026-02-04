#!/bin/bash

# Dubai SR - Deployment Script
# Run this on the server to update the app: ./deploy.sh

PROJECT_DIR="/var/www/dubai-sr"
BACKEND_SERVICE="dubai-sr-backend"

echo "🚀 Starting Deployment..."

# 1. Pull Latest Code
cd "$PROJECT_DIR" || exit
echo "📥 Pulling latest code..."
git pull origin main

# 2. Update Backend
echo "🐍 Updating Backend..."
cd backend
./venv/bin/pip install -r requirements.txt
# Run migrations if you have any (optional)
# ./venv/bin/python migrate.py

# 3. Update Frontend (Optional - remove if building locally)
# echo "⚛️ Building Frontend..."
# cd ../frontend
# npm install
# npm run build
# cp -r dist/* /var/www/html/ # Or wherever Nginx serves from

# 4. Restart Service
echo "🔄 Restarting Backend Service..."
sudo systemctl restart "$BACKEND_SERVICE"

echo "✅ Deployment Complete!"
