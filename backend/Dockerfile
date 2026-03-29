# ─── BACKEND DOCKERFILE ────────────────────────────────────────────────────────
# Node.js + Express + SQLite
# CommonJS module (require/module.exports) — no special ESM flags needed
#
# BUILD:  docker build -t expense-backend ./backend
# RUN:    docker run -p 3003:3003 --env-file .env expense-backend
# ────────────────────────────────────────────────────────────────────────────────

FROM node:18-alpine AS deps

WORKDIR /app

# Copy manifests first — Docker layer caches node_modules unless these change
COPY package*.json ./

# Install production deps only; devDependencies (nodemon) are not needed
RUN npm ci --omit=dev

# ── Runtime image ────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Non-root user for security — Alpine ships without useradd, use adduser
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create the data directory that will be mounted as a named volume.
# The volume holds database.sqlite so it survives container rebuilds.
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Copy installed modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 3003

# Healthcheck — docker-compose waits for this before starting ai-langx
# Interval/timeout/retries can be overridden in docker-compose.yaml
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "src/index.js"]
