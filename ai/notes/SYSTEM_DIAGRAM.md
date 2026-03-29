# 🎨 SYSTEM ARCHITECTURE DIAGRAM

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         EXPENSE TRACKER AI ORCHESTRATOR                     │
│                              (Production Ready)                             │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL CLIENTS                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📱 Frontend (Angular)     🔧 API Clients     📊 Testing Tools             │
│                                                                             │
│         │                        │                     │                    │
│         └────────────────────────┴─────────────────────┘                    │
│                                  │                                          │
│                           [JWT: Bearer token]                               │
│                                  │                                          │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ENTRY LAYER                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Express Server (Port 3001)                                                 │
│  ├── CORS Middleware                                                        │
│  ├── JSON Body Parser                                                       │
│  ├── Request Logger                                                         │
│  └── Auth Middleware (JWT extraction)                                       │
│                                                                             │
│                    ┌──────────────┬────────────┬──────────────┐            │
│                    │              │            │              │            │
└────────────────────┼──────────────┼────────────┼──────────────┼────────────┘
                     │              │            │              │
                     ▼              ▼            ▼              ▼
         
         POST /ai/chat    POST /ai/upload    GET /ai/debug/*    GET /health
              │                   │                 │               │
              │                   │                 │               │
┌─────────────┼───────────────────┼─────────────────┼───────────────┼─────────┐
│  ROUTING LAYER                  │                 │               │         │
├─────────────┼───────────────────┼─────────────────┼───────────────┼─────────┤
│             │                   │                 │               │         │
│             ▼                   ▼                 ▼               ▼         │
│    ┌─────────────────┐   ┌──────────┐   ┌──────────────┐  ┌──────────┐   │
│    │ Intent Router   │   │  Upload  │   │    Debug     │  │  Health  │   │
│    │  (Agent-lite)   │   │  Route   │   │    Routes    │  │  Check   │   │
│    └────────┬────────┘   └─────┬────┘   └──────────────┘  └──────────┘   │
│             │                   │                                          │
│   ┌─────────┼─────────┐         │                                          │
│   │  LLM + Rules      │         │                                          │
│   │  Classification   │         │                                          │
│   └─────────┬─────────┘         │                                          │
│             │                   │                                          │
│    ┌────────┴────────┐          │                                          │
│    │                 │          │                                          │
└────┼─────────────────┼──────────┼──────────────────────────────────────────┘
     │                 │          │
     ▼                 ▼          ▼
   INTENTS          PDF PIPELINE
     │                 │
     │                 │
┌────┼─────────────────┼──────────────────────────────────────────────────────┐
│  HANDLER LAYER      │          │                                            │
├────┼─────────────────┼──────────┼────────────────────────────────────────────┤
│    │                 │          │                                            │
│    ├─ TRANSACTIONAL  │          ▼                                            │
│    ├─ RAG_QA         │     ┌────────────────┐                               │
│    ├─ RAG_COMPARE    │     │ PDF Extractor  │                               │
│    └─ CLARIFICATION  │     │  (pdf-parse)   │                               │
│         │   │   │   │      └────────┬───────┘                               │
│         │   │   │   │               │                                       │
│         ▼   ▼   ▼   ▼               ▼                                       │
│    ┌────┐┌───┐┌───┐┌───┐     ┌──────────┐                                 │
│    │ TH ││RQA││RCO││CLR│     │  Chunker │                                 │
│    └─┬──┘└─┬─┘└─┬─┘└───┘     └────┬─────┘                                 │
│      │     │    │                  │                                        │
└──────┼─────┼────┼──────────────────┼────────────────────────────────────────┘
       │     │    │                  │
       ▼     │    │                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXECUTION LAYER                 │                  │                       │
├──────────────────────────────────┼──────────────────┼───────────────────────┤
│                                  │                  │                       │
│  ┌───────────────┐              │                  │                       │
│  │   LLM Agent   │              │                  ▼                       │
│  │  (OpenAI)     │              │          ┌────────────────┐              │
│  │               │              │          │   Embeddings   │              │
│  │ • Tool Call   │              │          │   Generator    │              │
│  │ • Loop        │              │          │  (OpenAI ada)  │              │
│  │ • Response    │              │          └───────┬────────┘              │
│  └───────┬───────┘              │                  │                       │
│          │                      │                  ▼                       │
│          ▼                      │          ┌────────────────┐              │
│  ┌───────────────┐              │          │ Vector Store   │              │
│  │  MCP Tools    │              │          │  (In-Memory)   │              │
│  │               │              │          │                │              │
│  │ • create      │              │          │ • Documents    │              │
│  │ • list        │              │          │ • Chunks       │              │
│  │ • modify      │              │          │ • Embeddings   │              │
│  │ • delete      │              │          │ • Persist      │              │
│  │ • clear       │              │          └───────┬────────┘              │
│  └───────┬───────┘              │                  │                       │
│          │                      │                  │                       │
│          ▼                      ▼                  ▼                       │
│  ┌───────────────┐      ┌──────────────┐  ┌──────────────┐               │
│  │Backend Client │      │   Search     │  │  Comparator  │               │
│  │   (Axios)     │      │   Engine     │  │   (Code)     │               │
│  └───────┬───────┘      │              │  │              │               │
│          │              │ • Cosine     │  │ • Normalize  │               │
│          │              │ • Top-K      │  │ • Match      │               │
│          │              │ • Hybrid     │  │ • Diff       │               │
│          │              └──────────────┘  └──────────────┘               │
│          │                                                                │
└──────────┼────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────┐              ┌─────────────────────┐               │
│  │  Backend Database  │              │  Vector Store File  │               │
│  │    (SQLite)        │              │  (vector-store.json)│               │
│  │                    │              │                     │               │
│  │  • Users           │              │  • Documents        │               │
│  │  • Expenses        │              │  • Chunks           │               │
│  │  • Categories      │              │  • Embeddings       │               │
│  │                    │              │  • Metadata         │               │
│  └────────────────────┘              └─────────────────────┘               │
│                                                                             │
│  Backend URL: http://localhost:3003   Data Dir: ./ai/data/                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────┐              ┌─────────────────────┐               │
│  │  OpenAI API        │              │   Custom LLM API    │               │
│  │                    │              │                     │               │
│  │  • Embeddings      │              │  • Chat Completion  │               │
│  │  • ada-002         │              │  • Tool Calling     │               │
│  │  • 1536 dims       │              │  • Llama-4          │               │
│  └────────────────────┘              └─────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  FLOW 1: TRANSACTIONAL (Add Expense)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User: "add 500 for lunch"                                                  │
│    ↓                                                                        │
│  [Intent Router] → TRANSACTIONAL                                            │
│    ↓                                                                        │
│  [Transactional Handler]                                                    │
│    ↓                                                                        │
│  [LLM Agent] → Calls create_expense tool                                    │
│    ↓                                                                        │
│  [MCP Tool] → POST /api/expenses                                            │
│    ↓                                                                        │
│  [Backend] → Save to database                                               │
│    ↓                                                                        │
│  [LLM] → "Added ₹500 for Food on 2026-02-01"                               │
│    ↓                                                                        │
│  Response: { reply: "...", intent: "TRANSACTIONAL" }                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  FLOW 2: RAG QA (Ask about PDF)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User: "what groceries are in my statement?"                                │
│    ↓                                                                        │
│  [Intent Router] → RAG_QA                                                   │
│    ↓                                                                        │
│  [RAG QA Handler]                                                           │
│    ↓                                                                        │
│  [Search Engine] → Generate query embedding                                 │
│    ↓                                                                        │
│  [Vector Store] → Cosine similarity search                                  │
│    ↓                                                                        │
│  [Top 5 chunks retrieved]                                                   │
│    ↓                                                                        │
│  [LLM] → Answer with context + citations                                    │
│    ↓                                                                        │
│  Response: "According to [Source 1], you spent ₹2,300 on groceries..."     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  FLOW 3: RAG COMPARE (Find Differences)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User: "compare my PDF with app"                                            │
│    ↓                                                                        │
│  [Intent Router] → RAG_COMPARE                                              │
│    ↓                                                                        │
│  [RAG Compare Handler]                                                      │
│    ↓                                                                        │
│  [Vector Store] → Extract PDF expenses                                      │
│    ↓                                                                        │
│  [Backend Client] → GET /api/expenses                                       │
│    ↓                                                                        │
│  [Comparator] → Code-based diff (normalize, match, classify)                │
│    ↓                                                                        │
│  [Comparison Result] → { matched: 18, pdfOnly: 3, appOnly: 2 }             │
│    ↓                                                                        │
│  [LLM] → Explain differences in natural language                            │
│    ↓                                                                        │
│  Response: "Found 18 matches, but 3 expenses in PDF not tracked..."        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  FLOW 4: PDF UPLOAD                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Client: Upload statement.pdf                                               │
│    ↓                                                                        │
│  [Multer] → Validate and buffer file                                        │
│    ↓                                                                        │
│  [PDF Extractor] → Extract text (3 pages, 5,432 chars)                     │
│    ↓                                                                        │
│  [Chunker] → Split into 12 chunks (500 chars, 100 overlap)                 │
│    ↓                                                                        │
│  [Embeddings] → Generate 12 vectors (1536 dims each)                        │
│    ↓                                                                        │
│  [Vector Store] → Store in memory + persist to disk                         │
│    ↓                                                                        │
│  Response: { success: true, document: { id, numChunks: 12 } }              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════════

Runtime:        Node.js 18+
Framework:      Express.js 4.x
Language:       JavaScript (ES6 Modules)
LLM:            OpenAI GPT-4o / Llama-4
Embeddings:     OpenAI text-embedding-ada-002
PDF:            pdf-parse
File Upload:    multer
HTTP Client:    axios
CORS:           cors
Env:            dotenv
Database:       None (uses backend API)
Vector DB:      Custom in-memory + JSON persistence


═══════════════════════════════════════════════════════════════════════════════
                           KEY METRICS
═══════════════════════════════════════════════════════════════════════════════

Files:              30+ files across 10 folders
Lines of Code:      ~3,000 lines
API Endpoints:      13 endpoints
Intent Types:       4 types
MCP Tools:          5 tools
RAG Components:     6 components
Debug Endpoints:    8 endpoints
Documentation:      5 comprehensive files


═══════════════════════════════════════════════════════════════════════════════
                           STATUS: PRODUCTION READY ✅
═══════════════════════════════════════════════════════════════════════════════
```
