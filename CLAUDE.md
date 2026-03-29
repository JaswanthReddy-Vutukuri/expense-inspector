# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expense Inspector is a full-stack expense tracking application with an AI-powered natural language interface. It consists of four independent services communicating over HTTP.

## Architecture

```
Angular Frontend → Express Backend ← AI layer (swappable)
                                      ├─ ai/       — vanilla
                                      └─ ai-langx/ — LangChain
```

**Strict separation of concerns — never mix responsibilities across folders:**
- `frontend/` — Angular 17 SPA (standalone components, Tailwind CSS, Lucide icons, Chart.js)
- `backend/` — Express + SQLite API. Source of truth for all data. No AI logic here.
- `ai/` — Vanilla AI orchestrator: raw OpenAI API, custom tool-calling loop, custom RAG pipeline
- `ai-langx/` — Same use case rebuilt with LangChain/LangGraph/LangSmith frameworks

**The AI layer is swappable.** Both implement identical features (same 5 tools, same intent routing, same RAG). Switch by changing `aiUrl` in `frontend/src/environments/environment.ts`. The backend is unaware of which AI service is calling it.

AI services do NOT access the database directly — they call backend HTTP APIs with the user's JWT token. The LLM acts as an orchestrator that decides which tools to call.

## Development Commands

### Frontend (`frontend/`)
```bash
npm start          # Dev server (default port 4200)
npm run build      # Production build (uses environment.prod.ts)
npm test           # Karma + Jasmine tests
```

### Backend (`backend/`)
```bash
npm run dev        # Nodemon dev server
npm start          # Production server
npm run seed       # Seed demo data into SQLite
```

### AI Vanilla (`ai/`)
```bash
npm run dev        # Nodemon dev server
npm start          # Production server
npm test           # Jest tests
npm run test:watch # Jest watch mode
```

### AI LangChain (`ai-langx/`)
```bash
npm run dev        # Nodemon dev server
npm start          # Production server
npm test           # Jest tests
```

### Running All Services
Each service has its own `node_modules` — run `npm install` inside each folder separately. Start backend first (AI services depend on it), then one AI service (either `ai/` or `ai-langx/`), then frontend. Three services needed for full functionality.

## Key Architecture Decisions

**Swappable AI layer**: `ai/` is vanilla (manual tool-calling loop, custom RAG, custom logging with traceId); `ai-langx/` is framework-based (LangChain AgentExecutor, LangGraph StateGraph, LangSmith tracing). Both expose the same 5 tools (createExpense, listExpenses, modifyExpense, deleteExpense, clearExpenses) and same safety patterns. Default model: `gpt-4o-mini`.

**Intent routing**: User messages are classified into TRANSACTIONAL (CRUD via tools), RAG_QA (PDF Q&A), RAG_COMPARE (PDF vs app data), SYNC_RECONCILE, or CLARIFICATION before being dispatched to specialized handlers.

**RAG pipeline**: PDF upload → text extraction → chunking (1500 chars, 400 overlap) → OpenAI embeddings (text-embedding-ada-002) → in-memory vector store persisted to JSON. All vectors are user-scoped.

**Safety limits** (production-critical, do not weaken):
- Max tool iterations: 5 (prevents infinite loops)
- LLM timeout: 60 seconds
- Max response tokens: 500
- Rate limiting: 100 req/15 min per IP

## Authentication Flow

JWT-based. Backend issues tokens on login/register. Frontend stores in localStorage, attaches via JwtInterceptor. AI services forward the user's JWT when calling backend APIs. All data is user-scoped. `JWT_SECRET` must match across backend and whichever AI service is active.

## Environment Configuration

All service URLs are configured via environment variables — no hardcoded URLs in source code.

**Frontend** (`src/environments/environment.ts`):
- `apiUrl` — backend API base URL
- `aiUrl` — AI service base URL
- To switch AI layer: change `aiUrl` port (default 3001 for vanilla, 3002 for LangChain)
- Production build auto-swaps to `environment.prod.ts` (relative URLs for reverse proxy)

**Backend** (`.env`, see `.env.example`):
- `PORT`, `NODE_ENV`, `JWT_SECRET`, `ALLOWED_ORIGINS`

**AI Vanilla** (`.env`, see `.env.example`):
- `PORT`, `NODE_ENV`, `OPENAI_API_KEY`, `BACKEND_BASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`
- Centralized config: `src/config/env.js` — validates required vars at startup, fails fast if missing

**AI LangChain** (`.env`, see `.env.example`):
- Same as vanilla plus `LANGCHAIN_API_KEY`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_PROJECT`
- Centralized config: `src/config/env.js` — same pattern as vanilla

**Convention**: all services use `BACKEND_BASE_URL` (not `BACKEND_URL`). All CORS uses `ALLOWED_ORIGINS`.

## API Documentation

Backend Swagger docs available at `/api-docs` endpoint when the server is running.
