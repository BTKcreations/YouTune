# ==========================================
# YouTune Frontend Dockerfile
# Multi-stage Node.js build with Nginx
# ==========================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments for Vite env variables during build
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package descriptors
COPY package*.json ./
RUN npm ci || npm install

# Copy application code
COPY . .

# Build application bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
