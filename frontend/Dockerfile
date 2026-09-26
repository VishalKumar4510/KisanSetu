# ===================================================
# Multi-stage Dockerfile for KisanSetu Frontend (Vite + Nginx)
# ===================================================

# --- Stage 1: Build Frontend Assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm install

# Copy shared models and frontend source code
WORKDIR /app
COPY shared ./shared/
COPY frontend ./frontend/

WORKDIR /app/frontend
RUN npm run build

# --- Stage 2: Lightweight Production Nginx Server ---
FROM nginx:alpine AS runner

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with reverse proxy and security headers
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:80/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
