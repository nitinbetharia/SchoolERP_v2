#!/usr/bin/env bash
set -euo pipefail

# Quick deploy script (single VM)
# Prereqs: docker + docker-compose, DNS pointing to this server
# Optional: run certbot to issue certs once DNS is ready

echo "[1/3] Pulling containers and starting services..."
docker compose up -d --build

echo "[2/3] (Optional) Issue Let's Encrypt cert (replace example.com with your domain)"
echo "docker run --rm -it -v certbot-etc:/etc/letsencrypt -v certbot-var:/var/lib/letsencrypt \
    -p 80:80 certbot/certbot certonly --standalone -d example.com -d *.example.com"

echo "[3/3] Done. App on :80/:443 via Nginx proxy to Node app (port 3000)."
