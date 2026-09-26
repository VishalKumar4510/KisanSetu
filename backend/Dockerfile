# ===================================================
# Multi-stage Dockerfile for KisanSetu Backend API
# ===================================================

# --- Stage 1: Build Application ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy package definitions and prisma schema
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# Copy shared types and backend source code
WORKDIR /app
COPY shared ./shared/
COPY backend ./backend/

WORKDIR /app/backend
RUN npm run build
RUN npx prisma generate

# --- Stage 2: Production Minimal Runner ---
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

# Create unprivileged system user for container security
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Copy production node_modules, Prisma client, and compiled artifacts
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health/live || exit 1

CMD ["node", "dist/backend/src/server.js"]
