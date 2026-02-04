# Deploying to Hostinger VPS (Ubuntu)

This folder contains scripts to help you set up and deploy your application on a VPS.

## 1. Initial Setup

1.  **Connect to your VPS** via SSH:
    ```bash
    ssh root@<YOUR_VPS_IP>
    ```

2.  **Upload the setup script** (run this from your local machine):
    ```bash
    scp deploy/setup_vps.sh root@<YOUR_VPS_IP>:~/
    ```

3.  **Run the script** on your VPS:
    ```bash
    chmod +x setup_vps.sh
    ./setup_vps.sh
    ```
    *This will install Nginx, Python, Node.js, configure the firewall, and set up the project structure.*

## 2. Uploading Your Code

Since `git clone` might require keys, the easiest way for the first time is to upload your local files.

**From your local machine:**
```bash
# 1. Build frontend locally (faster than building on VPS)
cd frontend
npm run build

# 2. Upload Backend
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '.git' ../backend root@<YOUR_VPS_IP>:/var/www/dubai-sr/

# 3. Upload Frontend Build
rsync -avz ../frontend/dist/ root@<YOUR_VPS_IP>:/var/www/dubai-sr/frontend/dist/
```

## 3. Configuration

1.  **Create .env file:**
    On the server, create the `.env` file:
    ```bash
    nano /var/www/dubai-sr/backend/.env
    ```
    *Paste your production environment variables here.*

2.  **Start the Service:**
    ```bash
    systemctl enable --now dubai-sr-backend
    ```

3.  **Setup SSL (HTTPS):**
    ```bash
    certbot --nginx -d srfashiondubai.com
    ```

## 4. Updates

To update your code later, you can usually just re-run the `rsync` commands above and then restart the service:
```bash
ssh root@<YOUR_VPS_IP> "systemctl restart dubai-sr-backend"
```
