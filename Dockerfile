# Multi-stage Frontend Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies with lockfile consistency
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build static assets
COPY . .
ARG VITE_API_URL=https://api.404tn.com/api
ARG VITE_CARTO_API_KEY=""
ARG VITE_SITE_URL=https://404tn.com
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_CARTO_API_KEY=${VITE_CARTO_API_KEY} \
    VITE_SITE_URL=${VITE_SITE_URL}

RUN npm run build

# Stage 2: Minimal hardened unprivileged nginx runtime
FROM nginxinc/nginx-unprivileged:alpine-slim

COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
