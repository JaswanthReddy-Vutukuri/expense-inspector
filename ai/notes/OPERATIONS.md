# Setup, Deployment & Production Readiness

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Starting the Service](#starting-the-service)
5. [Testing Endpoints](#testing-endpoints)
6. [Debug & Observability](#debug--observability)
7. [Deployment Checklist](#deployment-checklist)
8. [Security Audit Findings](#security-audit-findings)
9. [Production Readiness Assessment](#production-readiness-assessment)
10. [Monitoring & Observability](#monitoring--observability)
11. [Troubleshooting](#troubleshooting)
12. [Production Recommendations](#production-recommendations)

---

## Prerequisites

- **Node.js 18+** installed
- **OpenAI API key** (for embeddings and LLM)
- **Backend service** running (default: port 3003)
- **Valid JWT token** from backend (login via frontend or backend API)

---

## Installation

```bash
# Navigate to AI folder
cd ai

# Install dependencies
npm install
```

**Key dependencies:**
- `openai` -- LLM and embeddings API
- `express` -- Web framework
- `axios` -- HTTP client for backend API
- `pdf-parse` -- PDF text extraction
- `multer` -- File upload handling
- `cors` -- Cross-origin resource sharing
- `dotenv` -- Environment variable loading
- `helmet` -- Security headers
- `express-rate-limit` -- Rate limiting

**Verify installation:**
```bash
npm list pdf-parse multer openai
```

---

## Environment Configuration

### Centralized Config: `src/config/env.js`

All environment variables are loaded and validated through `src/config/env.js`. This file:
- Validates required variables at startup
- **Fails fast** with a clear error message if anything is missing
- Provides defaults for optional variables
- Prevents direct `process.env` access elsewhere in the codebase

### Setup

Create a `.env` file in the `ai/` folder. Use `.env.example` as a reference:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### Required Variables

```env
# OpenAI API key (for embeddings)
OPENAI_API_KEY=sk-...

# Backend API URL -- where the Node.js/SQLite backend is running
BACKEND_BASE_URL=http://localhost:3003
```

If either of these is missing, the service will exit immediately with:
```
[Config] FATAL: Missing required environment variable: OPENAI_API_KEY
[Config] Check your .env file (see .env.example for reference)
```

### Optional Variables

```env
# Service port (default: 3001)
PORT=3001

# Environment mode
NODE_ENV=development

# LLM model (default: gpt-4o-mini)
LLM_MODEL=gpt-4o-mini

# Embedding model (default: text-embedding-ada-002)
EMBEDDING_MODEL=text-embedding-ada-002

# JWT secret (for local token decoding, optional if delegating to backend)
JWT_SECRET=your_secret_key_here

# CORS allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:4200,https://yourdomain.com

# RAG Configuration
CHUNK_SIZE=1500             # Characters per chunk (default: 1500)
CHUNK_OVERLAP=200           # Overlap between chunks (default: 200)
MIN_SIMILARITY=0.3          # Search similarity threshold (default: 0.3)
SEARCH_TOP_K=5              # Number of results to return (default: 5)
```

---

## Starting the Service

**Development mode (with hot-reload):**
```bash
cd ai
npm run dev
```

**Production mode:**
```bash
cd ai
npm start
```

**Expected output:**
```
AI Orchestrator running on http://localhost:3001
Backend URL: http://localhost:3003
```

**Memory configuration:** The service uses up to 4GB heap (`--max-old-space-size=4096`) for handling large vector stores.

---

## Testing Endpoints

### Setup Shell Variables

To avoid hardcoded URLs in test commands, set these shell variables:

```bash
# Set service URLs
export AI=http://localhost:3001
export BACKEND=http://localhost:3003

# Get a JWT token from backend
export JWT=$(curl -s -X POST $BACKEND/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.token')
```

### 1. Health Check

```bash
curl $AI/health
```

Expected:
```json
{ "status": "OK", "service": "AI Orchestrator" }
```

### 2. Test Transactional (Add Expense)

```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "add 500 rupees for lunch today"}'
```

Expected: `intent: "TRANSACTIONAL"` with expense confirmation.

### 3. Test Clarification (Help)

```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "what can you do?"}'
```

Expected: `intent: "CLARIFICATION"` with help message.

### 4. Test PDF Upload

```bash
curl -X POST $AI/ai/upload \
  -H "Authorization: Bearer $JWT" \
  -F "file=@/path/to/your/statement.pdf"
```

Expected:
```json
{
  "success": true,
  "documentId": "doc_...",
  "chunks": 12,
  "pages": 3,
  "message": "PDF processed successfully"
}
```

### 5. Test RAG Q&A (After Uploading PDF)

```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "what expenses are in my uploaded statement?"}'
```

Expected: `intent: "RAG_QA"` with answer citing sources.

### 6. Test Comparison

```bash
# Ensure you have expenses in the app
curl -X GET $BACKEND/api/expenses \
  -H "Authorization: Bearer $JWT"

# Then compare
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "compare my bank statement with my tracked expenses"}'
```

Expected: `intent: "RAG_COMPARE"` with comparison summary.

### 7. Test Sync/Reconciliation

```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "sync expenses from PDF"}'
```

Expected: `intent: "SYNC_RECONCILE"` with full pipeline execution and report links.

---

## Debug & Observability

### Debug Endpoints

All debug endpoints require JWT authorization.

**System Statistics:**
```bash
curl $AI/ai/debug/stats \
  -H "Authorization: Bearer $JWT"
```
Returns: total documents, total chunks, embedding dimension, memory usage, uptime.

**Similarity Search Test:**
```bash
curl "$AI/ai/debug/search?q=groceries&topK=3" \
  -H "Authorization: Bearer $JWT"
```

**List Document Chunks:**
```bash
curl "$AI/ai/debug/chunks?limit=5" \
  -H "Authorization: Bearer $JWT"
```

**List Uploaded Documents:**
```bash
curl $AI/ai/debug/documents \
  -H "Authorization: Bearer $JWT"
```

**Detailed Health Check:**
```bash
curl $AI/ai/debug/health \
  -H "Authorization: Bearer $JWT"
```
Returns: vectorStore status, embeddings status, LLM status, system info.

**Embedding Test:**
```bash
curl "$AI/ai/debug/embedding-test?text=hello%20world" \
  -H "Authorization: Bearer $JWT"
```

**Similarity Test:**
```bash
curl -X POST $AI/ai/debug/similarity-test \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"text1": "coffee expense", "text2": "coffee purchase"}'
```

**Comparison Engine Test:**
```bash
curl -X POST $AI/ai/debug/compare-test \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "pdfExpenses": [{"amount": 100, "description": "Coffee"}],
    "appExpenses": [{"amount": 100, "category_name": "Food"}]
  }'
```

### Data Storage

The system creates a `data/` folder to persist:
- `vector-store.json` -- All uploaded documents, chunks, and embeddings
- `reports/` -- Generated CSV + HTML reconciliation reports

To reset the vector store:
```bash
rm -rf data/vector-store.json
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] `npm install` completed without errors
- [ ] `.env` file created with all required variables
- [ ] `OPENAI_API_KEY` is valid and has credits
- [ ] `BACKEND_BASE_URL` points to the correct backend
- [ ] Backend service is running and healthy: `curl $BACKEND/health`
- [ ] `data/` directory exists with write permissions: `mkdir -p data && touch data/test.txt && rm data/test.txt`

### Service Startup

- [ ] Service starts without errors: `npm start`
- [ ] Health check passes: `curl $AI/health`
- [ ] Detailed health check passes: `curl $AI/ai/debug/health -H "Authorization: Bearer $JWT"`

### Functional Verification

- [ ] Transactional intent works (add/list/modify/delete expenses)
- [ ] Clarification intent works (greetings/help)
- [ ] PDF upload processes successfully
- [ ] RAG QA intent works (after PDF upload)
- [ ] RAG Compare intent works (with PDF + app data)
- [ ] Sync/Reconcile intent works (full pipeline)
- [ ] Vector store persists to disk
- [ ] Similarity search returns results
- [ ] Debug endpoints are accessible

### Performance Benchmarks

- [ ] Chat response < 3 seconds (transactional)
- [ ] PDF upload processes < 10 seconds per MB
- [ ] Similarity search completes < 1 second
- [ ] Memory usage stable over time

### Security Verification

- [ ] All endpoints require JWT
- [ ] Invalid tokens are rejected (401)
- [ ] File size limits enforced (10MB)
- [ ] Error messages do not leak secrets or stack traces
- [ ] CORS restricted to allowed origins
- [ ] Rate limiting active (100 req/15min)
- [ ] User isolation: User A cannot see User B's documents

---

## Security Audit Findings

### Audit Context

Performed as a principal engineer audit to assess production readiness. The audit covered architecture compliance, MCP isolation, transactional flow, RAG pipeline, vector store, comparison logic, observability, code quality, and security.

### Confirmed Strengths

| Area | Status | Evidence |
|------|--------|----------|
| Single entry point (POST /ai/chat) | CONFIRMED | All chat via `src/routes/chat.js` |
| Intent routing before execution | CONFIRMED | `src/router/intentRouter.js` with hybrid LLM+rules |
| MCP tool isolation (no direct DB access) | CONFIRMED | All 5 tools use `backendClient.js` over HTTP |
| JWT forwarding to backend | CONFIRMED | `Authorization: Bearer` header in Axios client |
| Code-based comparison (not LLM) | CONFIRMED | `src/comparison/expenseComparator.js` with Jaccard similarity |
| LLM only for explanation | CONFIRMED | Comparison result computed first, then LLM explains |
| Debug endpoints operational | CONFIRMED | 8+ endpoints in `src/routes/debug.js` |
| Handler delegation pattern | CONFIRMED | Switch statement routes to 5 separate handlers |

### Issues Identified and Addressed

The initial audit (February 1, 2026) identified critical gaps. Subsequent production hardening (February 7, 2026) addressed them:

| Issue | Initial Status | Current Status | Resolution |
|-------|---------------|----------------|------------|
| No user isolation in RAG | CRITICAL | RESOLVED | userId filtering in vectorStore + search |
| Auth middleware incomplete | CRITICAL | RESOLVED | JWT decoded, userId extracted |
| No input validation | CRITICAL | RESOLVED | Validation in MCP tools + chat route |
| Business logic in LLM prompts | CONCERN | MITIGATED | Category cache + date normalizer added |
| CORS wide open | CRITICAL | RESOLVED | Origin restriction via `ALLOWED_ORIGINS` env var |
| No rate limiting | CRITICAL | RESOLVED | 100 req/15min via express-rate-limit |
| No test coverage | CRITICAL | PARTIAL | Test framework added, critical paths covered |
| Chunk size too small | CONCERN | RESOLVED | Increased to 1500 chars (~375 tokens) |
| No page metadata | CONCERN | RESOLVED | Page-by-page extraction preserved |
| No cost visibility | CONCERN | RESOLVED | `utils/costTracking.js` with tier budgets |
| No timeout protection | CONCERN | RESOLVED | 30s tool timeout, 60s LLM timeout |
| No retry logic | CONCERN | RESOLVED | `utils/retry.js` with exponential backoff |
| No idempotency | CONCERN | RESOLVED | `utils/idempotency.js` with 24h cache |

### Remaining Recommendations (Post-MVP)

- Response caching for common queries (cost optimization)
- Prometheus/Grafana metrics endpoint
- Database-backed idempotency (currently in-memory)
- Database-backed cost tracking (currently in-memory)
- Approximate nearest neighbor indexing (FAISS/HNSW) for scale
- Demo UI dashboard (currently API-only debug endpoints)
- Jupyter notebook demo for RAG visualization
- CI/CD pipeline with automated tests

---

## Production Readiness Assessment

### Production Hardening Status

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Structured Logging | COMPLETE | `utils/logger.js` -- JSON logs, trace IDs, log levels |
| Error Classification | COMPLETE | `utils/errorClassification.js` -- Smart retry decisions |
| Timeout Protection | COMPLETE | 30s per tool, 60s per LLM call |
| Tool Iteration Limits | COMPLETE | Max 5 iterations (prevents infinite loops) |
| Retry Logic | COMPLETE | `utils/retry.js` -- Exponential backoff + jitter |
| Idempotency | COMPLETE | `utils/idempotency.js` -- 24h cache for writes |
| Cost Tracking | COMPLETE | `utils/costTracking.js` -- Per-user token budgets |
| User Isolation | COMPLETE | RAG vectorStore + search filtered by userId |
| Input Validation | COMPLETE | Length limits, type checks, sanitization |
| Audit Logging | COMPLETE | Structured logs with full context |
| Rate Limiting | COMPLETE | Existing middleware + token budgets |
| Request Tracing | COMPLETE | Trace IDs through entire request flow |
| Security Headers | COMPLETE | Helmet middleware |
| CORS Restriction | COMPLETE | Environment-configurable origins |

### Production Capacity

- Handles 100 concurrent requests (timeout protection)
- Prevents cost explosion (token budgets + iteration limits)
- Safe retries (idempotency prevents duplicates)
- User isolation (multi-tenant ready)
- Full observability (structured logs with traces)

### Architecture Assessment

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 7/10 | Intent routing, MCP pattern, handlers well-designed |
| Functionality | 7/10 | All 5 intent types working, reconciliation pipeline complete |
| Security | 6/10 | User isolation, rate limiting, JWT forwarding implemented |
| Code Quality | 6/10 | Good structure, documented. Tests partial. |
| Scalability | 4/10 | In-memory vector store, linear search O(n) |
| Observability | 7/10 | Structured logging, debug endpoints, cost tracking |

### Key Differentiators

- Bi-directional reconciliation (PDF-to-app and app-to-PDF, rare in expense trackers)
- Zero-LLM financial decisions (compliance-ready)
- Comprehensive audit trail (enterprise-grade)
- User isolation at every layer (security-first)
- MCP pattern (industry best practice for AI safety)

---

## Monitoring & Observability

### Logging Levels

```
[Intent Router]            Intent classification decisions
[Transactional Handler]    Expense CRUD operations
[RAG QA Handler]           Document Q&A flow
[RAG Compare Handler]      Comparison operations
[Sync Handler]             Reconciliation stages
[Reconciliation Planner]   Planning decisions
[Tool Executor]            MCP tool invocations
[LLM Agent]                Token usage, latency
[Vector Store]             Document operations
[PDF Generator]            Report generation
[Cost Tracker]             Token usage and budgets
```

### Key Metrics to Monitor

**Memory Usage:**
```bash
curl $AI/ai/debug/health -H "Authorization: Bearer $JWT" | jq '.memory'
```

**Document Count:**
```bash
curl $AI/ai/debug/stats -H "Authorization: Bearer $JWT" | jq '.totalDocuments'
```

**Response Time:**
```bash
time curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "add 100 for coffee"}'
```

### Performance Benchmarks

| Operation | Typical Duration |
|-----------|-----------------|
| LLM response | ~2-5s |
| PDF upload processing | ~5-15s (varies by size) |
| Vector similarity search | ~50-200ms |
| MCP tool execution | ~100-500ms |
| Full reconciliation (27 expenses) | ~30-60s |

### Cost Monitoring

```bash
# Per-user usage (via debug endpoints or logs)
# Look for cost-tracker log entries with:
#   userId, model, totalTokens, cost

# Aggregate analytics available via:
#   getAggregateUsage() -> { totalCost, totalRequests, topUsers }
```

---

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### "OPENAI_API_KEY not found" or "BACKEND_BASE_URL not found"
- Create `.env` file in `ai/` folder (see `.env.example`)
- The service fails fast on startup if required vars are missing
- Check `src/config/env.js` for the full list of required vs optional variables

### "Connection refused" to backend
```bash
# Check backend is running
curl $BACKEND/health

# If not running:
cd ../backend
npm install
npm start
```

### "401 Unauthorized" errors
```bash
# Get a fresh JWT token
curl -X POST $BACKEND/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### PDF upload fails
1. Check file size (max 10MB)
2. Ensure file is a valid PDF (not corrupted)
3. Check server has write permissions to `data/` folder
4. Check server logs for detailed error messages

### Search returns empty results
- Upload a document first via `POST /ai/upload`
- Verify upload succeeded: `curl $AI/ai/debug/documents -H "Authorization: Bearer $JWT"`
- Check chunk count: `curl $AI/ai/debug/stats -H "Authorization: Bearer $JWT"`

### High memory usage
- Clear vector store: `rm data/vector-store.json`
- Reduce CHUNK_SIZE in `.env`
- Restart the service
- Monitor with: `curl $AI/ai/debug/health -H "Authorization: Bearer $JWT"`

### "JavaScript heap out of memory"
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm start`
- This was historically caused by the chunker infinite loop bug (now fixed)

### Intent always classified as TRANSACTIONAL
- This was a known bug (now fixed) where rule-based classification short-circuited LLM classification
- Verify intent routing: send "compare my PDF with app" and check the `intent` field in response

### Sync/reconciliation shows "undefined expenses"
- Fixed in current version using correct field names (`approvedForApp`, `approvedForPdf`)
- Ensure you are running the latest code

---

## Production Recommendations

### Short-term

1. **Database migrations**: Add Prisma or Knex for backend schema management
2. **Redis**: Implement for rate limiting, caching, and session management
3. **Cost monitoring dashboard**: Expose token usage via admin endpoint
4. **CI/CD**: GitHub Actions for automated testing and deployment
5. **Backup strategy**: Periodic backup of `data/vector-store.json`

### Medium-term

1. **PostgreSQL migration**: Replace SQLite for multi-user scalability
2. **Vector database**: Replace in-memory store with Pinecone, Qdrant, or pgvector
3. **Request queueing**: Bull/BullMQ for large PDF processing
4. **Docker containers**: Containerize all three services
5. **Error tracking**: Sentry/Rollbar integration

### Long-term

1. **Kubernetes**: Auto-scaling for AI orchestrator
2. **Multi-region**: Distribute for latency reduction
3. **Fallback LLMs**: Add Anthropic/Llama as backup providers
4. **CDN**: Serve frontend via CloudFront/Cloudflare
5. **OAuth2 gateway**: Replace direct JWT with OAuth2 layer
6. **WAF**: Web Application Firewall for additional protection
7. **Encryption at rest**: Encrypt vector store and report files
8. **HttpOnly cookies**: Move JWT from localStorage to HttpOnly cookies
