# ─── FRONTEND DOCKERFILE ────────────────────────────────────────────────────────
# Stage 1: Angular build  →  Stage 2: Nginx serves the dist/
#
# The Angular build uses environment.prod.ts which has relative URLs (/api,
# /ai-langchain). Nginx in docker-compose.yaml resolves those upstream proxies.
# Nothing in this image is environment-specific — it can be deployed anywhere.
#
# BUILD:  docker build -t expense-frontend ./frontend
# ────────────────────────────────────────────────────────────────────────────────

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install all deps (including devDependencies — Angular CLI is a devDep)
RUN npm ci

COPY . .

# Production build — swaps in environment.prod.ts automatically via angular.json
RUN npm run build -- --configuration production

# ── Runtime image — nginx:alpine (~25MB) serves the static dist ──────────────
FROM nginx:alpine

# Remove default nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular production build output
# angular.json outputPath is "dist/expense-tracker-frontend/browser"
# (Angular 17 application builder adds a "browser" subfolder)
COPY --from=builder /app/dist/expense-tracker-frontend/browser /usr/share/nginx/html

# nginx.conf is injected at runtime via the bind mount in docker-compose.yaml:
#   - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
# To edit nginx config without rebuilding the image:
#   1. Edit nginx/nginx.conf
#   2. docker compose exec nginx nginx -s reload

EXPOSE 80

# nginx starts in the foreground — required for Docker
CMD ["nginx", "-g", "daemon off;"]
