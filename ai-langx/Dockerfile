# ─── AI-LANGX DOCKERFILE ────────────────────────────────────────────────────────
# Node.js + LangChain + LangGraph + LangSmith
# ESM module ("type": "module") — no transpile step needed
#
# Memory note: --max-old-space-size=4096 is set because LangChain loads large
# embedding arrays into memory. Tune this to the host machine's available RAM.
# On a 2GB VPS you may need to lower this (e.g. 1024).
#
# BUILD:  docker build -t expense-ai-langx ./ai-langx
# RUN:    docker run -p 3002:3002 --env-file .env expense-ai-langx
# ────────────────────────────────────────────────────────────────────────────────

FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ── Runtime image ────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# data/vectorstore is the path memory.store.js writes langchain-store.json to.
# Mounting a named volume here persists uploaded PDF vectors across redeploys.
RUN mkdir -p /app/data/vectorstore && chown -R appuser:appgroup /app/data

COPY --from=deps /app/node_modules ./node_modules

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 3002

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

# --max-old-space-size allocates extra heap for LangChain's in-memory vectors.
CMD ["node", "--max-old-space-size=4096", "server.js"]
