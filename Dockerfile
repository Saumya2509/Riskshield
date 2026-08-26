# =========================================================================
# Stage 1: Build RiskShield React + Vite Production Bundle
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (leverages Docker layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files and compile TypeScript & Vite
COPY . .
RUN npm run build

# =========================================================================
# Stage 2: Serve with High-Performance Nginx Alpine Runtime
# =========================================================================
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Health check to ensure container availability
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
