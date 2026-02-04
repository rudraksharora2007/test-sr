#!/bin/bash

# Dubai SR - VPS Setup Script for Ubuntu 20.04/22.04
# Run as root: sudo ./setup_vps.sh

LOG_FILE="/var/log/dubai-sr-setup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
    exit 1
}

# 1. Update System
log "Updating system packages..."
apt update && apt upgrade -y || error "Failed to update system"

# 2. Install Dependencies
log "Installing dependencies..."
apt install -y python3-pip python3-venv nodejs npm nginx git certbot python3-certbot-nginx ufw acl || error "Failed to install dependencies"

# 3. Setup Firewall (UFW)
log "Configuring Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 4. Create Project Directory
PROJECT_DIR="/var/www/dubai-sr"
if [ ! -d "$PROJECT_DIR" ]; then
    log "Creating project directory at $PROJECT_DIR..."
    mkdir -p "$PROJECT_DIR"
    
    # Clone repo
    log "Cloning repository from GitHub..."
    git clone https://github.com/rudraksharora2007/test-sr.git "$PROJECT_DIR" || error "Failed to clone repository"
    
    log "Repository cloned successfully."
else
    log "Project directory exists at $PROJECT_DIR. Pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main || error "Failed to pull latest changes"
fi

# Set permissions
chown -R $USER:www-data "$PROJECT_DIR"
chmod -R 775 "$PROJECT_DIR"

# 5. Setup Backend
log "Setting up Backend..."
BACKEND_DIR="$PROJECT_DIR/backend"
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv || error "Failed to create venv"
    fi
    
    # Install Python deps
    ./venv/bin/pip install -r requirements.txt || error "Failed to install Python requirements"
    
    log "Backend setup complete."
else
    log "Backend directory not found! Skipping setup (assuming files not uploaded yet)."
fi

# 6. Setup Frontend
log "Setting up Frontend..."
FRONTEND_DIR="$PROJECT_DIR/frontend"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # Install Node deps & Build
    # npm install || error "Failed to install Node dependencies" # Warning: Takes time/memory
    # npm run build || error "Failed to build frontend"
    
    # log "Frontend build complete."
    log "Note: It is recommended to build locally and upload the 'dist' folder to save server resources."
else
    log "Frontend directory not found!"
fi

# 7. Configure Nginx
log "Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/dubai-sr"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name srfashiondubai.com www.srfashiondubai.com;

    root /var/www/dubai-sr/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        alias /var/www/dubai-sr/backend/uploads;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx || error "Nginx configuration failed"

# 8. Setup Systemd Service for Backend
log "Configuring Systemd for Backend..."
SERVICE_FILE="/etc/systemd/system/dubai-sr-backend.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Dubai SR Backend Service
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
EnvironmentFile=$PROJECT_DIR/backend/.env
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# systemctl enable dubai-sr-backend
# systemctl start dubai-sr-backend

log "Setup Complete! 🚀"
log "Next Steps:"
log "1. Upload your code to $PROJECT_DIR"
log "2. Create .env file in $PROJECT_DIR/backend/"
log "3. Build frontend locally and upload 'dist' folder to $PROJECT_DIR/frontend/"
log "4. Run: systemctl enable --now dubai-sr-backend"
log "5. Run: certbot --nginx -d srfashiondubai.com"
