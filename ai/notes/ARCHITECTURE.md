# System Architecture & Design Decisions

## Table of Contents

1. [System Overview](#system-overview)
2. [Three-Service Architecture](#three-service-architecture)
3. [Architecture Diagram](#architecture-diagram)
4. [Directory Structure](#directory-structure)
5. [Data Flows](#data-flows)
   - [Flow 1: Chat / Transactional](#flow-1-chat--transactional)
   - [Flow 2: PDF Upload](#flow-2-pdf-upload)
   - [Flow 3: RAG Q&A](#flow-3-rag-qa)
   - [Flow 4: RAG Compare](#flow-4-rag-compare)
   - [Flow 5: Sync / Reconciliation](#flow-5-sync--reconciliation)
6. [Intent Classification](#intent-classification)
7. [Design Decisions](#design-decisions)
   - [Agent-Lite Pattern](#1-agent-lite-pattern-not-full-agent)
   - [MCP Tool Pattern](#2-mcp-tool-pattern)
   - [Intent-Based Routing](#3-intent-based-routing)
   - [Deterministic Reconciliation](#4-deterministic-reconciliation)
   - [Repository Structure](#5-three-separate-services)
   - [In-Memory Vector Store](#6-in-memory-vector-store)
8. [Integration Points](#integration-points)
9. [Technology Stack](#technology-stack)
10. [Key Metrics](#key-metrics)

---

## System Overview

Enterprise-grade AI Orchestrator implementing the **Model Context Protocol (MCP)** pattern with **RAG (Retrieval-Augmented Generation)** capabilities for intelligent expense management.

The `ai/` folder implements a **custom AI orchestration layer** that sits between the Angular frontend and the Node.js/SQLite backend. It does NOT use any framework (no LangChain, no LangGraph). All orchestration, tool calling, and workflow management is built from scratch.

**Key Design Principles:**
- **Custom Tool-Calling Loop**: Manual implementation of the ReAct pattern (Reason, Act, Observe)
- **Deterministic Business Logic**: Financial operations use pure JavaScript, NOT LLMs
- **MCP Pattern**: Model Context Protocol -- LLM only calls validated tool wrappers
- **Separation of Concerns**: Intent classification, handler delegation, tool execution

---

## Three-Service Architecture

```
+-------------------------------------------------+
|   FRONTEND (Angular 17) - Port 4200            |
|   - Material Design UI                          |
|   - Authentication (JWT)                        |
|   - Expense CRUD                                |
|   - AI Chat Interface with PDF Upload           |
+-----------------+-------------------------------+
                  |
                  +---> REST API Calls
                  |
+-----------------v-------------------------------+
|   BACKEND API (Express) - Port 3003            |
|   - User Authentication (bcrypt + JWT)          |
|   - Expense CRUD with validation                |
|   - SQLite database                             |
|   - Swagger documentation                       |
+-----------------+-------------------------------+
                  |
                  <--- MCP Tools (indirect coupling)
                  |
+-----------------v-------------------------------+
|   AI ORCHESTRATOR (Express) - Port 3001        |
|   - Intent Classification (LLM-based)           |
|   - MCP Tool Pattern (API wrappers)             |
|   - RAG Pipeline (PDF processing)               |
|   - Bi-directional Reconciliation               |
|   - Vector Store (in-memory + disk)             |
+-------------------------------------------------+
```

### Service Responsibilities

**Frontend (Angular)** -- UI only. Auth flows, expense CRUD UI, AI chat UI. Never talks to DB or LLM.

**Backend (Node.js + SQLite)** -- Source of truth. Auth, expenses, dashboard. OpenAPI-defined APIs. No AI logic.

**AI Orchestrator** -- Intelligence layer. Natural language understanding, LLM calls, MCP tool execution, RAG pipeline, reconciliation. Stateless per request. Never directly accesses the database.

---

## Architecture Diagram

```
+-----------------------------------------------------------------------------+
|  EXTERNAL CLIENTS                                                           |
|                                                                             |
|  Frontend (Angular)     API Clients     Testing Tools                       |
|         |                    |                |                              |
|         +--------------------+----------------+                              |
|                              |                                              |
|                       [JWT: Bearer token]                                   |
+------------------------------+----------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------------------+
|  ENTRY LAYER                                                                |
|                                                                             |
|  Express Server (Port 3001)                                                 |
|  +-- Helmet (security headers)                                              |
|  +-- CORS Middleware (origin restriction)                                    |
|  +-- Rate Limiting (100 req/15min)                                          |
|  +-- JSON Body Parser                                                       |
|  +-- Request Logger                                                         |
|  +-- Auth Middleware (JWT extraction)                                        |
|                                                                             |
|          POST /ai/chat    POST /ai/upload    GET /ai/debug/*    GET /health |
+----------+---------------+------------------+---------------+---------------+
           |               |                  |               |
           v               v                  v               v
+----------+---------------+------------------+-------------------------------+
|  ROUTING LAYER                                                              |
|                                                                             |
|    Intent Router        Upload         Debug           Health               |
|    (Agent-lite)         Route          Routes          Check                |
|         |                 |                                                 |
|    LLM + Rules            |                                                 |
|    Classification         |                                                 |
|         |                 |                                                 |
+----+----+-----------------+----+--------------------------------------------+
     |    |    |    |        |
     v    v    v    v        v
+----+----+----+----+--------+--------------------------------------------+
|  HANDLER LAYER                                                          |
|                                                                         |
|  TRANSACTIONAL   RAG_QA    RAG_COMPARE   SYNC_RECONCILE   CLARIFICATION |
|       |            |            |              |                         |
|       v            v            v              v                        |
+-------+------------+------------+--------------+------------------------+
|  EXECUTION LAYER                                                        |
|                                                                         |
|  LLM Agent (OpenAI)          RAG Pipeline           Reconciliation      |
|  +-- Tool call loop          +-- PDF Extractor      +-- Compare         |
|  +-- Conversation history    +-- Chunker            +-- Plan            |
|  +-- Max 5 iterations        +-- Embeddings         +-- Validate        |
|  +-- 60s LLM timeout         +-- Vector Store       +-- Sync            |
|                               +-- Search Engine      +-- Report         |
|  MCP Tools                                                              |
|  +-- create_expense          Comparison Engine                          |
|  +-- list_expenses           +-- Normalize                              |
|  +-- modify_expense          +-- Match (Jaccard)                        |
|  +-- delete_expense          +-- Diff                                   |
|  +-- clear_expenses                                                     |
|       |                                                                 |
|       v                                                                 |
|  Backend Client (Axios) -- JWT forwarding                               |
+----+--------------------------------------------------------------------+
     |
     v
+-----------------------------------------------------------------------------+
|  DATA LAYER                                                                 |
|                                                                             |
|  Backend Database (SQLite)          Vector Store File (vector-store.json)    |
|  +-- Users                          +-- Documents                           |
|  +-- Expenses                       +-- Chunks                              |
|  +-- Categories                     +-- Embeddings                          |
|                                     +-- Metadata (userId isolation)         |
|                                                                             |
|  Backend URL: $BACKEND_BASE_URL     Data Dir: ./ai/data/                    |
+-----------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
|  EXTERNAL SERVICES                                                          |
|                                                                             |
|  OpenAI API                    Custom LLM API                               |
|  +-- Embeddings (ada-002)      +-- Chat Completion                          |
|  +-- 1536 dimensions           +-- Tool Calling                             |
+-----------------------------------------------------------------------------+
```

---

## Directory Structure

### Backend

```
backend/
+-- src/
|   +-- index.js                    # Server entry point
|   +-- app.js                      # Express app setup
|   +-- controllers/
|   |   +-- authController.js       # Login/register logic
|   |   +-- expenseController.js    # Expense CRUD
|   |   +-- dashboardController.js  # Summary stats
|   +-- middlewares/
|   |   +-- authMiddleware.js       # JWT verification
|   |   +-- errorMiddleware.js      # Global error handler
|   +-- routes/
|   |   +-- authRoutes.js
|   |   +-- expenseRoutes.js
|   |   +-- dashboardRoutes.js
|   |   +-- index.js                # Route aggregator
|   +-- validators/
|   |   +-- authValidator.js        # Registration/login validation
|   |   +-- expenseValidator.js     # Expense data validation
|   +-- database/
|   |   +-- db.js                   # SQLite connection
|   |   +-- schema.js               # Table definitions
|   |   +-- seed.js                 # Default categories
|   +-- docs/
|       +-- swagger.js              # API documentation
+-- package.json
```

### Frontend

```
frontend/src/app/
+-- auth/
|   +-- login/                      # Login component
|   +-- register/                   # Registration component
+-- dashboard/                      # Dashboard with charts & summary
+-- expenses/
|   +-- expense-list/               # Table view with pagination
|   +-- expense-form/               # Add/Edit form
+-- ai-chat/                        # AI chat widget with PDF upload
+-- layout/                         # Shell with navigation
+-- guards/
|   +-- auth.guard.ts               # Route protection
+-- interceptors/
|   +-- jwt.interceptor.ts          # Auto-attach JWT to requests
|   +-- error.interceptor.ts        # Global error handling
+-- services/
|   +-- auth.service.ts             # Authentication service
|   +-- expense.service.ts          # Expense API client
|   +-- ai-chat.service.ts          # AI chat API client
+-- models/
|   +-- expense.model.ts
|   +-- user.model.ts
+-- shared/                         # Shared components
+-- app.routes.ts                   # Route configuration
+-- app.config.ts                   # App configuration
```

### AI Orchestrator

```
ai/
+-- server.js                          # Main Express server
+-- package.json                       # Dependencies
+-- .env.example                       # Environment template
+-- data/                              # Runtime data storage
|   +-- vector-store.json              # Persisted vector database
|   +-- reports/                       # Generated CSV + HTML reports
+-- src/
|   +-- config/
|   |   +-- env.js                     # Centralized environment config (fails fast)
|   +-- router/
|   |   +-- intentRouter.js            # Intent classification (Agent-lite)
|   +-- handlers/
|   |   +-- transactionalHandler.js    # Expense CRUD operations
|   |   +-- ragQaHandler.js            # Document Q&A
|   |   +-- ragCompareHandler.js       # PDF vs App comparison
|   |   +-- syncReconcileHandler.js    # Bi-directional reconciliation
|   |   +-- clarificationHandler.js    # Help & guidance
|   +-- llm/
|   |   +-- agent.js                   # OpenAI tool-calling loop
|   |   +-- systemPrompt.js            # LLM instructions
|   +-- mcp/
|   |   +-- tool.interface.js          # Tool type definitions
|   |   +-- tools/                     # Backend API wrappers
|   |       +-- index.js               # Tool registry
|   |       +-- createExpense.js
|   |       +-- listExpenses.js
|   |       +-- modifyExpense.js
|   |       +-- deleteExpense.js
|   |       +-- clearExpenses.js
|   +-- rag/
|   |   +-- chunker.js                 # Text splitting with overlap
|   |   +-- embeddings.js              # OpenAI embeddings
|   |   +-- vectorStore.js             # In-memory vector DB
|   |   +-- search.js                  # Similarity search engine
|   +-- comparison/
|   |   +-- expenseComparator.js       # Code-based diff logic
|   +-- reconcile/
|   |   +-- reconciliationPlanner.js   # Deterministic planning
|   |   +-- syncHandler.js             # Sync execution
|   +-- reports/
|   |   +-- pdfGenerator.js            # CSV + HTML report generation
|   +-- routes/
|   |   +-- chat.js                    # POST /ai/chat
|   |   +-- upload.js                  # POST /ai/upload
|   |   +-- debug.js                   # GET /ai/debug/*
|   +-- middleware/
|   |   +-- auth.js                    # JWT extraction
|   |   +-- errorHandler.js            # Centralized errors
|   +-- utils/
|   |   +-- backendClient.js           # Backend API client
|   |   +-- pdfExtractor.js            # PDF text extraction
|   |   +-- dateNormalizer.js          # Date format converter
|   |   +-- categoryCache.js           # Category lookup cache
|   |   +-- logger.js                  # Structured logging with trace IDs
|   |   +-- errorClassification.js     # Smart retry decisions
|   |   +-- retry.js                   # Exponential backoff + jitter
|   |   +-- toolExecutor.js            # Timeouts, validation, safety
|   |   +-- idempotency.js             # Duplicate prevention
|   |   +-- costTracking.js            # Token budgets, usage analytics
|   +-- validators/
|       +-- expenseValidator.js        # Pre-backend validation
+-- tests/                             # Jest test suites
```

---

## Data Flows

### Flow 1: Chat / Transactional

Handles: add, list, update, delete, clear expenses.

```
User: "add 500 for lunch today"
    |
    v
[Auth Middleware]
    +-- Extract userId from JWT
    +-- Validate token
    +-- Forward to handler
    |
    v
[Intent Router]
    +-- Build few-shot prompt
    +-- Call LLM (temp=0.1)
    +-- Classify: TRANSACTIONAL
    +-- Validate intent
    |
    v
[Transactional Handler]
    +-- Forward to LLM Agent
    +-- Provide MCP tool definitions
    |
    v
[LLM Agent - Tool Calling Loop]
    |
    +---> [LLM] Analyze message
    |       +---> Generate tool call: create_expense({
    |               amount: 500,
    |               category: "Food",
    |               description: "lunch",
    |               expense_date: "2026-02-02"
    |             })
    |
    +---> [Tool Executor] Invoke MCP tool
    |       +---> [Validation] Check amount > 0, date format
    |       +---> [Backend Client] POST /api/expenses (JWT forwarded)
    |       +---> Return: { id: 123, amount: 500, ... }
    |
    +---> [LLM] Generate natural language response
            +---> "Added 500 for lunch today"
    |
    v
Response: { reply: "...", intent: "TRANSACTIONAL" }
```

**Key observations:**
- LLM makes TWO API calls: (1) tool decision, (2) natural language response
- Tool execution is synchronous (waits for backend)
- Errors at any stage return to LLM for graceful handling
- Max 5 tool iterations to prevent infinite loops

### Flow 2: PDF Upload

```
Client uploads statement.pdf
    |
    v
[Multer] --> Validate and buffer file (10MB limit)
    |
    v
[PDF Extractor] --> Extract text page-by-page with pdf-parse
    |                Multi-tier fallback for corrupt PDFs
    v
[Chunker] --> Split into chunks (1500 chars, 200 overlap)
    |          Smart sentence boundary detection
    |          Infinite loop prevention (MAX_CHUNKS=10000)
    v
[Embeddings] --> Generate vectors (OpenAI text-embedding-ada-002, 1536 dims)
    |             Batch processing (100 chunks/call)
    v
[Vector Store] --> Store in-memory with userId isolation
    |               Persist to data/vector-store.json
    v
Response: { success: true, documentId, chunks, pages }
```

**Key observations:**
- Each chunk gets its own embedding (not one per document)
- Overlap prevents information loss at boundaries
- User isolation enforced at storage layer
- Persistence ensures data survives service restarts

### Flow 3: RAG Q&A

```
User: "how much did I spend on hotels?"
    |
    v
[Intent Router] --> Classify: RAG_QA
    |
    v
[RAG QA Handler]
    |
    +---> [Query Embedding] Convert question to 1536-dim vector
    |
    +---> [Similarity Search]
    |       +-- Filter chunks by userId
    |       +-- Compute cosine similarity with all user chunks
    |       +-- Filter: similarity >= 0.3
    |       +-- Return: Top-5 chunks with scores
    |
    +---> [Context Augmentation]
    |       +-- Format: [Source 1]: chunk text, [Source 2]: ...
    |       +-- System: "Answer based ONLY on provided context"
    |
    +---> [LLM Generation]
            +-- Temperature: 0.3 (factual)
            +-- Max tokens: 500
            +-- Output: Answer with source citations
    |
    v
Response: "Based on your statement, you spent $850 on hotels:
- Hotel Grand Stay: $350 (Jan 15) [Source 1]
- Luxury Hotel: $500 (Jan 22) [Source 2]"
```

### Flow 4: RAG Compare

```
User: "compare my PDF with app expenses"
    |
    v
[Intent Router] --> Classify: RAG_COMPARE
    |
    v
[RAG Compare Handler]
    |
    +---> [Vector Store] --> Extract PDF expenses via regex patterns
    |
    +---> [Backend Client] --> GET /api/expenses (via MCP tool)
    |
    +---> [Comparator] --> Code-based diff (NOT LLM)
    |       +-- Normalize dates (YYYY-MM-DD)
    |       +-- Normalize amounts (float)
    |       +-- Normalize descriptions (lowercase)
    |       +-- Match: amount tolerance +/-0.01, Jaccard similarity
    |       +-- Classify: matched, pdfOnly, appOnly
    |       +-- Calculate match confidence scores
    |
    +---> [LLM] --> Explain differences in natural language
    |                (LLM ONLY explains -- does NOT compute diff)
    |
    v
Response: "Found 18 matches, but 3 expenses in PDF not tracked..."
```

### Flow 5: Sync / Reconciliation

Six-stage pipeline with ZERO LLM decision-making on financial operations:

```
User: "sync my PDF expenses"
    |
    v
Intent Router --> SYNC_RECONCILE
    |
    v
STAGE 1: COMPARE (ragCompareHandler, returnStructured=true)
    +-- Extract expenses from PDF (via vector store regex)
    +-- Fetch expenses from app (via MCP listExpenses)
    +-- Deterministic code-based diff (NO LLM)
    +-- Output: {matched[], pdf_only[], app_only[]}
    |
    v
STAGE 2: PLAN (reconciliationPlanner)
    +-- Validate each expense (amount, date, category)
    +-- Normalize dates: "Feb 3, 2026" --> "2026-02-03"
    +-- Check duplicates (stable key algorithm)
    +-- Rules: MIN=$1, MAX=$10K, NO auto-delete
    +-- Classify: {add_to_app[], add_to_pdf[], ignored[]}
    +-- Output: Bi-directional reconciliation plan
    |
    v
STAGE 3: VALIDATE (syncHandler)
    +-- Pre-flight safety checks
    +-- Verify auth token
    +-- Validate plan structure
    |
    v
STAGE 4: SYNC (syncHandler)
    +-- Deduplicate by stable key (date|amount|category|description)
    +-- Validate dates BEFORE backend call
    +-- Execute via MCP createExpense (one at a time)
    +-- Track: succeeded / failed (retryable) / skipped (validation error)
    +-- Idempotent, handles partial failures gracefully
    +-- Rate limiting: 100ms delay between requests
    |
    v
STAGE 5: REPORT (pdfGenerator)
    +-- Fetch all app expenses via MCP
    +-- Merge with add_to_pdf expenses
    +-- Generate CSV + HTML reports
    +-- Save to reports/ with "synced_" prefix
    |
    v
STAGE 6: RESPOND
    +-- Comprehensive summary with planning + execution metrics
    +-- Download links for reports
    +-- Clear error categorization
```

---

## Intent Classification

The intent router uses a hybrid approach: rule-based keyword matching first, then LLM classification as backup.

### Intent Types

| Intent | Triggers | Pipeline |
|--------|----------|----------|
| **TRANSACTIONAL** | add, create, show, list, delete, update, modify expenses | LLM Agent + MCP Tools + Backend API |
| **RAG_QA** | questions about PDFs, statements, uploaded files | Vector Search + LLM with Context |
| **RAG_COMPARE** | compare, difference, match, discrepancy, vs | Code Diff + LLM Explanation |
| **SYNC_RECONCILE** | sync, reconcile, update app, add missing | 6-Stage Reconciliation Pipeline |
| **CLARIFICATION** | greetings, help requests, unclear inputs | Static/Template Response |

### Classification Strategy

**Tier 1 -- Rules (Fast, Free):**
```
If message contains:
- sync, reconcile, update app  --> SYNC_RECONCILE
- compare, mismatch, vs        --> RAG_COMPARE
- upload, pdf, document         --> RAG_QA
- add, delete, update, list     --> TRANSACTIONAL
```

**Tier 2 -- LLM Classifier (Fallback):**
- Model: gpt-4o-mini
- Temperature: 0.1 (near-deterministic)
- Few-shot examples for each intent
- Whitelist validation (rejects invalid intents)

This reduces LLM calls by approximately 60%.

---

## Design Decisions

### 1. Agent-Lite Pattern (Not Full Agent)

**What**: LLM used for classification only, not autonomous planning. One classification decision, then deterministic execution.

**Why**:
- Predictability: same input leads to same handler
- Cost control: 1-2 LLM calls vs many in full agent
- Easy debugging: clear execution paths
- Production reliability: no "surprise" tool usage

**Trade-offs**:

| Aspect | Full Agent | Agent-Lite (Ours) |
|--------|-----------|-------------------|
| Flexibility | High | Medium |
| Predictability | Low | High |
| Cost | High (many LLM calls) | Low (1-2 calls) |
| Debugging | Hard | Easy |
| Latency | Variable | Consistent |

**When to use each**: Full agents suit research and creative tasks. Agent-lite suits production systems, financial apps, and customer support.

### 2. MCP Tool Pattern

**What**: Backend API calls wrapped in validated tool definitions. AI never calls backend directly -- all actions go through MCP tools.

**Why**:
- **Security**: Enforces authentication and authorization
- **Validation**: Backend validation rules preserved
- **Auditability**: All AI actions logged with clear mapping: intent, tool, API call
- **Testability**: Tools can be tested independently
- **Replaceability**: Same tools callable by UI or API

**Tool Structure**:
```javascript
{
  definition: {
    type: "function",
    function: { name, description, parameters: { /* JSON Schema */ } }
  },
  run: async (args, token) => {
    // Validation + Backend API call via Axios
  }
}
```

**MCP Tools**:

| Tool | Backend Endpoint | Purpose |
|------|------------------|---------|
| `create_expense` | POST /api/expenses | Add new expense |
| `list_expenses` | GET /api/expenses | Retrieve with filters |
| `modify_expense` | PUT /api/expenses/:id | Update existing |
| `delete_expense` | DELETE /api/expenses/:id | Remove single |
| `clear_expenses` | DELETE /api/expenses | Bulk delete |

### 3. Intent-Based Routing

**What**: Single classification decision followed by deterministic execution.

**Why**:
- Clear separation of concerns (each pipeline optimized independently)
- Scalability (transactional queries remain fast, RAG scales horizontally)
- Cost control (RAG invoked only when necessary)
- Explainability ("The system first classifies your request, then routes it")
- Future expansion (add forecasting, anomaly detection without touching existing flows)

### 4. Deterministic Reconciliation

**What**: Code-based financial logic with ZERO LLM involvement.

**Why**:
- **Regulatory compliance**: Many jurisdictions forbid "AI decisions" on money
- **Audit trail**: Code-based logic is traceable and version-controlled
- **Reproducibility**: Same inputs ALWAYS produce same outputs
- **Trust**: Users need guarantees, not probabilities
- **Accountability**: Every rejection has an explicit, inspectable reason

### 5. Three Separate Services

**What**: Frontend, backend, and AI orchestrator as independent services.

**Why**:
- AI is NOT CRUD -- it deserves its own boundary
- Independent scaling (AI needs more compute)
- Technology flexibility (swap LLM without touching backend)
- Security (AI cannot bypass backend validation)
- Development velocity (teams can work in parallel)

**Communication Flow**:
- Normal UI flow: `Frontend --> Backend API`
- AI Chat flow: `Frontend --> AI Orchestrator --> Backend API`
- Backend never knows AI exists. Frontend never knows backend internals.

### 6. In-Memory Vector Store

**What**: Custom in-memory storage with JSON persistence instead of a dedicated vector DB.

**Pros**: Simple, no external dependencies, fast retrieval, easy to understand.

**Cons**: Not horizontally scalable, limited by server RAM, linear search O(n).

**Migration Path**:
- 0-100 documents: In-memory is fine
- 100-1,000 documents: Consider pgvector
- 1,000-10,000+ documents: Dedicated vector DB (Pinecone, Weaviate, Qdrant)

---

## Integration Points

### Authentication: JWT Pass-Through

1. User logs in to backend, receives JWT
2. Frontend stores JWT
3. Frontend sends JWT to both backend (normal flows) and AI orchestrator (chat)
4. AI orchestrator extracts JWT and forwards it to backend APIs via `Authorization: Bearer` header
5. Single source of auth truth = backend

**Key**: AI orchestrator forwards JWT for backend validation. It also decodes the token to extract `userId` for user isolation in the vector store and RAG searches.

### Backend API Consumption

The AI Orchestrator:
- Uses the backend's REST API via Axios HTTP client
- Wraps each endpoint as an MCP tool
- Handles retries, mapping, normalization
- Backend upgrades happen without AI changes

### API Endpoints

**AI Service:**
```
POST   /ai/chat                    # Main chat entry point
POST   /ai/upload                  # PDF upload and processing
GET    /ai/debug/stats             # Vector store statistics
GET    /ai/debug/chunks            # List all chunks
GET    /ai/debug/search?q=...      # Test similarity search
GET    /ai/debug/documents         # List uploaded PDFs
GET    /ai/debug/health            # Detailed health check
GET    /ai/debug/embedding-test    # Test embedding generation
POST   /ai/debug/similarity-test   # Test cosine similarity
POST   /ai/debug/compare-test     # Test comparison engine
GET    /ai/debug/vector-analysis   # Embedding statistics
GET    /health                     # Basic health check
```

**Backend API (consumed by AI via MCP):**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/expenses               # List user expenses (with filters)
POST   /api/expenses               # Create expense
GET    /api/expenses/:id           # Get specific expense
PUT    /api/expenses/:id           # Update expense
DELETE /api/expenses/:id           # Delete expense
GET    /api/dashboard/summary      # Get spending summary
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Language | JavaScript (ES6 Modules) |
| LLM | OpenAI GPT-4o-mini (configurable) |
| Embeddings | OpenAI text-embedding-ada-002 (1536 dimensions) |
| PDF | pdf-parse |
| File Upload | multer |
| HTTP Client | axios |
| CORS | cors |
| Security | helmet, express-rate-limit |
| Environment | dotenv, centralized via `src/config/env.js` |
| Database | None (uses backend API) |
| Vector DB | Custom in-memory + JSON persistence |
| Frontend | Angular 17, Tailwind CSS, Lucide icons, Chart.js |
| Backend DB | SQLite |
| Auth | JWT + bcryptjs |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Files | 30+ files across 10+ folders |
| Lines of Code | ~3,000+ lines |
| API Endpoints | 13 endpoints |
| Intent Types | 5 types |
| MCP Tools | 5 tools |
| RAG Components | 6 components |
| Debug Endpoints | 8+ endpoints |
| Reconciliation Stages | 6 stages |

---

## Future Enhancements

- Re-ranking: Two-stage retrieval (fast first pass, accurate second pass via cross-encoder)
- External vector DB migration (Pinecone, Weaviate, Qdrant)
- Query decomposition for complex multi-aspect questions
- Redis caching layer for embeddings and common queries
- Feedback loops and eval metrics (Precision@K, MRR, NDCG)
- Multi-modal RAG (OCR for scanned PDFs, image extraction)
- Prometheus metrics endpoint
- Advanced NER for expense extraction
- CI/CD pipeline
