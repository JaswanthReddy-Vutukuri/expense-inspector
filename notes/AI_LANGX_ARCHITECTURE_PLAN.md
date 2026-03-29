# AI LangX Architecture Plan
**Production-Grade LangChain + LangGraph + LangSmith Implementation**

**Date**: February 8, 2026  
**Project**: Expense Tracker AI Layer Refactor  
**Scope**: Replace `ai/` custom implementation with framework-based `ai-langx/`  
**Constraints**: Backend and Frontend remain unchanged

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Module Responsibilities](#3-module-responsibilities)
4. [Graph Workflow Design](#4-graph-workflow-design)
5. [State Object Design](#5-state-object-design)
6. [Tool Wrapper Design](#6-tool-wrapper-design)
7. [RAG Pipeline Architecture](#7-rag-pipeline-architecture)
8. [Observability with LangSmith](#8-observability-with-langsmith)
9. [LangGraph vs Agents Decision](#9-langgraph-vs-agents-decision)
10. [Deterministic Orchestration](#10-deterministic-orchestration)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular)                           │
│                    /ai/chat | /ai/upload | /ai/debug                 │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP POST
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                      AI-LANGX EXPRESS SERVER                         │
│                         (Port 3001)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              INTENT CLASSIFICATION GRAPH                    │    │
│  │  (Determines: transactional | rag_qa | rag_compare | ...)  │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │                  SPECIALIZED GRAPHS                        │     │
│  │  ┌─────────────┐  ┌──────────┐  ┌────────────────────┐   │     │
│  │  │ Transactional│  │ RAG Q&A  │  │ Reconciliation     │   │     │
│  │  │ Graph        │  │ Graph    │  │ Graph (6 stages)   │   │     │
│  │  │ (w/ Agent)   │  │ (Chain)  │  │ (Deterministic)    │   │     │
│  │  └─────────────┘  └──────────┘  └────────────────────┘   │     │
│  └───────────────────────────────────────────────────────────┘     │
│                             │                                        │
│                             ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │                   SHARED SERVICES                          │     │
│  │  - LangChain Tools (StructuredTool)                        │     │
│  │  - RAG Pipeline (VectorStore + Retriever)                  │     │
│  │  - LangSmith Callbacks (Auto-tracing)                      │     │
│  │  - Deterministic Orchestrators (Pure JS)                   │     │
│  └───────────────────────────────────────────────────────────┘     │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND APIs                                  │
│                    (Port 3003, unchanged)                            │
│             /expenses | /categories | /auth | ...                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      LANGSMITH PLATFORM                              │
│           (Automatic tracing, monitoring, debugging)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Philosophy

**Hybrid Approach**: Framework-based orchestration + Deterministic business logic

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Intent Classification** | LangGraph StateGraph | Visual workflow, conditional routing |
| **Transactional Operations** | LangGraph + AgentExecutor | Tool-calling needs flexibility |
| **RAG Q&A** | LangChain RetrievalQAChain | Standard pattern, proven |
| **RAG Comparison** | LangGraph + Custom Logic | Need access to comparison algorithm |
| **Reconciliation** | LangGraph StateGraph | Complex 6-stage workflow |
| **Financial Logic** | Pure JavaScript Functions | Deterministic, testable, audit-friendly |
| **Observability** | LangSmith | Production monitoring |

### 1.3 Core Principles

1. **Separation of Concerns**
   - LLM: Natural language interface only
   - Framework: Orchestration, tool-calling, RAG
   - Deterministic Logic: Financial rules, validation, comparison

2. **Backward Compatibility**
   - Same Express endpoints (`/ai/chat`, `/ai/upload`)
   - Same request/response format
   - Frontend & Backend unchanged

3. **Production-Grade**
   - Type safety (TypeScript + Zod)
   - Error handling (standardized)
   - Observability (LangSmith)
   - Testing (unit + integration)

4. **Maintainability**
   - Standard LangChain patterns
   - Clear module boundaries
   - Documented workflows

---

## 2. Folder Structure

```
ai-langx/
│
├── server.js                          # Express entry point
├── package.json                       # Dependencies
├── .env.template                      # Environment variables template
├── tsconfig.json                      # TypeScript configuration
│
├── src/
│   │
│   ├── config/                        # Configuration
│   │   ├── env.config.js              # Environment validation
│   │   ├── llm.config.js              # LLM settings (model, temp, etc.)
│   │   └── langsmith.config.js        # LangSmith setup
│   │
│   ├── graphs/                        # LangGraph workflows
│   │   ├── intent-router.graph.js     # Main intent classification graph
│   │   ├── transactional.graph.js     # Expense operations (w/ agent)
│   │   ├── rag-qa.graph.js            # RAG question answering
│   │   ├── rag-compare.graph.js       # PDF vs App comparison
│   │   └── reconciliation.graph.js    # 6-stage sync workflow
│   │
│   ├── agents/                        # AgentExecutor instances
│   │   └── expense.agent.js           # Transactional agent setup
│   │
│   ├── tools/                         # LangChain StructuredTools
│   │   ├── index.js                   # Tool factory (createToolsWithContext)
│   │   ├── createExpense.tool.js      # CreateExpenseTool class
│   │   ├── listExpenses.tool.js       # ListExpensesTool class
│   │   ├── modifyExpense.tool.js      # ModifyExpenseTool class
│   │   ├── deleteExpense.tool.js      # DeleteExpenseTool class
│   │   └── clearExpenses.tool.js      # ClearExpensesTool class
│   │
│   ├── rag/                           # RAG pipeline
│   │   ├── chains/                    # LangChain chains
│   │   │   ├── qa.chain.js            # RetrievalQAChain setup
│   │   │   └── index.js               # Chain factory
│   │   │
│   │   ├── vectorstore/               # Vector storage
│   │   │   ├── memory.store.js        # MemoryVectorStore wrapper
│   │   │   └── index.js               # getVectorStore singleton
│   │   │
│   │   ├── embeddings/                # Embedding generation
│   │   │   ├── openai.embeddings.js   # OpenAI embeddings config
│   │   │   └── index.js               # createEmbeddings factory
│   │   │
│   │   ├── ingestion/                 # Document processing
│   │   │   ├── pdf.processor.js       # PDF text extraction
│   │   │   ├── chunker.js             # Text chunking (RecursiveCharacterTextSplitter)
│   │   │   └── ingest.js              # Full ingestion pipeline
│   │   │
│   │   └── retrieval/                 # Search logic
│   │       ├── retriever.js           # Retriever configuration
│   │       └── filters.js             # Metadata filter helpers
│   │
│   ├── orchestrators/                 # Deterministic workflows
│   │   ├── comparison/                # Expense comparison
│   │   │   ├── comparator.js          # Jaccard similarity algorithm
│   │   │   ├── matcher.js             # Matching rules
│   │   │   └── diff.js                # Diff generation
│   │   │
│   │   ├── reconciliation/            # Sync planning
│   │   │   ├── planner.js             # Plan generation (deterministic)
│   │   │   ├── validator.js           # Pre-sync validation
│   │   │   ├── executor.js            # Plan execution via tools
│   │   │   └── reporter.js            # Report generation
│   │   │
│   │   └── extraction/                # Data extraction
│   │       ├── expense.extractor.js   # Regex-based expense extraction
│   │       └── patterns.js            # Regex patterns
│   │
│   ├── prompts/                       # Prompt templates
│   │   ├── classification.prompt.js   # Intent classification
│   │   ├── transactional.prompt.js    # Agent system prompt
│   │   ├── rag-qa.prompt.js           # RAG Q&A prompt
│   │   └── summarization.prompt.js    # Response summarization
│   │
│   ├── utils/                         # Shared utilities
│   │   ├── backend-client.js          # Axios client for backend
│   │   ├── category-cache.js          # Category normalization
│   │   ├── date-normalizer.js         # Date parsing
│   │   ├── validators.js              # Input validation (Zod schemas)
│   │   ├── error-handler.js           # Error classification
│   │   ├── trace-helper.js            # LangSmith metadata helpers
│   │   └── logger.js                  # Winston logger
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── auth.js                    # JWT authentication
│   │   ├── error-handler.js           # Global error handler
│   │   ├── rate-limiter.js            # Rate limiting
│   │   └── request-logger.js          # HTTP request logging
│   │
│   └── routes/                        # Express routes
│       ├── chat.js                    # POST /ai/chat (main endpoint)
│       ├── upload.js                  # POST /ai/upload (PDF ingestion)
│       └── debug.js                   # GET /ai/debug (system info)
│
├── data/                              # Data storage
│   ├── vectorstore/
│   │   └── memory-store.json          # Persisted vector store
│   └── reports/                       # Generated reports
│       └── *.csv, *.html
│
├── tests/                             # Test suites
│   ├── unit/                          # Unit tests
│   │   ├── tools/                     # Tool tests
│   │   ├── orchestrators/             # Deterministic logic tests
│   │   └── utils/                     # Utility tests
│   │
│   ├── integration/                   # Integration tests
│   │   ├── graphs/                    # Graph workflow tests
│   │   └── rag/                       # RAG pipeline tests
│   │
│   └── e2e/                           # End-to-end tests
│       └── chat.test.js               # Full chat flow
│
└── docs/                              # Documentation
    ├── GRAPH_WORKFLOWS.md             # Graph design docs
    ├── TOOL_REFERENCE.md              # Tool documentation
    └── DEPLOYMENT.md                  # Production deployment guide
```

---

## 3. Module Responsibilities

### 3.1 Core Modules

#### **1. Graphs (`src/graphs/`)**

**Purpose**: Define LangGraph StateGraph workflows for complex multi-step operations

**Responsibilities**:
- Define state schemas (Zod)
- Define graph nodes (async functions)
- Define edges (conditional routing)
- Compile and export graph apps
- Handle state transitions

**Example**: `intent-router.graph.js`
```javascript
// Nodes: classifyIntent, routeToHandler
// Edges: Conditional based on intent
// State: { userMessage, intent, confidence, result }
```

**When to Use LangGraph**:
- ✅ Multi-step workflows with branching
- ✅ Need visualization (LangSmith)
- ✅ State persistence required
- ✅ Complex conditional logic

**When NOT to Use**:
- ❌ Simple linear function call
- ❌ Pure deterministic logic (use orchestrators)

---

#### **2. Agents (`src/agents/`)**

**Purpose**: Create AgentExecutor instances for tool-calling workflows

**Responsibilities**:
- Configure LLM for agent
- Attach tools with context
- Set up prompts
- Configure agent settings (maxIterations, etc.)

**Example**: `expense.agent.js`
```javascript
export const createExpenseAgent = (authToken, context) => {
  const llm = createLLM({...});
  const tools = createToolsWithContext(authToken, context);
  const prompt = createAgentPrompt();
  const agent = createOpenAIToolsAgent({ llm, tools, prompt });
  
  return new AgentExecutor({
    agent,
    tools,
    maxIterations: 5,
    returnIntermediateSteps: true
  });
};
```

**When to Use**:
- ✅ Natural language → tool calls
- ✅ Dynamic tool selection by LLM
- ✅ Need flexibility in execution order

---

#### **3. Tools (`src/tools/`)**

**Purpose**: Wrap backend API calls in LangChain StructuredTool format

**Responsibilities**:
- Define Zod schemas for tool inputs
- Validate arguments
- Normalize inputs (category, date, etc.)
- Call backend APIs via backendClient
- Format results for LLM
- Handle errors gracefully

**Pattern**:
```javascript
export class CreateExpenseTool extends StructuredTool {
  name = "create_expense";
  description = "Add a new expense...";
  schema = CreateExpenseSchema;  // Zod
  
  constructor(authToken, context) {
    super();
    this.authToken = authToken;
    this.context = context;
  }
  
  async _call(args) {
    // 1. Normalize inputs
    // 2. Validate business rules
    // 3. Call backend API
    // 4. Return formatted result
  }
}
```

**Why StructuredTool**:
- ✅ Automatic OpenAI function calling schema
- ✅ Zod validation
- ✅ Type safety
- ✅ Consistent error handling
- ✅ LangSmith auto-tracing

---

#### **4. RAG Pipeline (`src/rag/`)**

**Purpose**: Implement Retrieval-Augmented Generation for PDF analysis

**Sub-modules**:

**4.1 Vector Store (`rag/vectorstore/`)**
- Manages MemoryVectorStore instance
- Singleton pattern: `getVectorStore()`
- Persistence: save/load from disk
- User isolation: metadata filtering

**4.2 Embeddings (`rag/embeddings/`)**
- Creates OpenAI embeddings instance
- Configuration: model, dimensions
- Reusable across store/retriever

**4.3 Ingestion (`rag/ingestion/`)**
- PDF extraction: `pdf-parse`
- Text chunking: `RecursiveCharacterTextSplitter`
- Metadata enrichment: userId, filename, timestamp
- Store chunks: `vectorStore.addDocuments()`

**4.4 Retrieval (`rag/retrieval/`)**
- Create retriever from vector store
- Configure search parameters (k, threshold)
- Metadata filters (userId)

**4.5 Chains (`rag/chains/`)**
- RetrievalQAChain setup
- Custom prompts
- Source document handling

**Design Decision**: Use LangChain abstractions (not custom)
- ✅ Easy to swap vector stores (Memory → Pinecone)
- ✅ Standard retriever interface
- ✅ Built-in chains

---

#### **5. Orchestrators (`src/orchestrators/`)**

**Purpose**: Pure JavaScript deterministic business logic

**Sub-modules**:

**5.1 Comparison (`orchestrators/comparison/`)**
- **comparator.js**: Jaccard similarity algorithm
- **matcher.js**: Match expenses by rules (amount, date, description)
- **diff.js**: Generate diff (matched, pdfOnly, appOnly)

**Example**:
```javascript
export function compareExpenses(pdfExpenses, appExpenses) {
  // Pure algorithm (no LLM, no I/O)
  const matched = [];
  const pdfOnly = [];
  const appOnly = [];
  
  // Deterministic matching logic
  // Return structured diff
}
```

**5.2 Reconciliation (`orchestrators/reconciliation/`)**
- **planner.js**: Generate sync plan from diff (deterministic rules)
- **validator.js**: Pre-sync validation (amount thresholds, duplicates)
- **executor.js**: Execute plan using tools (async I/O)
- **reporter.js**: Generate CSV/HTML reports

**5.3 Extraction (`orchestrators/extraction/`)**
- **expense.extractor.js**: Regex-based expense extraction from text
- **patterns.js**: Regex patterns for amounts, dates, categories

**Why Separate from Graphs**:
- ✅ Testable deterministic logic
- ✅ No framework dependencies
- ✅ Can unit test without mocking
- ✅ Financial logic audit-friendly
- ✅ Reusable across graphs

---

#### **6. Prompts (`src/prompts/`)**

**Purpose**: Centralize and version LLM prompts

**Responsibilities**:
- Use `PromptTemplate` from LangChain
- Template variables (date, context, etc.)
- Few-shot examples
- Export reusable prompt instances

**Example**: `classification.prompt.js`
```javascript
import { PromptTemplate } from "@langchain/core/prompts";

export const classificationPrompt = PromptTemplate.fromTemplate(`
You are an intent classifier for an expense tracking AI.

Current Date: {date}

User Message: "{message}"

Classify into ONE of these intents:
- expense_operation: Create, list, modify, or delete expenses
- rag_question: Questions about uploaded PDF documents
- rag_compare: Compare PDF expenses with app expenses
- reconciliation: Sync PDF expenses to app
- general_chat: Greetings, help, unclear request

Return JSON:
{{"intent": "expense_operation", "confidence": 0.95}}
`);
```

**Benefits**:
- ✅ Prompt versioning
- ✅ LangSmith prompt testing
- ✅ A/B testing without code changes
- ✅ Template reuse

---

#### **7. Utils (`src/utils/`)**

**Purpose**: Shared utility functions

**Key Modules**:

**7.1 backend-client.js**
- Axios instance with backend base URL
- Request/response interceptors
- Token injection
- Error handling

**7.2 category-cache.js**
- Fetch categories from backend
- In-memory cache (refresh every 1 hour)
- Fuzzy matching for user input

**7.3 date-normalizer.js**
- Parse "today", "yesterday", "last Friday"
- Convert to ISO format
- Handle timezones

**7.4 validators.js**
- Zod schemas for request validation
- `ChatRequestSchema`, `UploadRequestSchema`
- Validation functions

**7.5 error-handler.js**
- Classify errors (validation, network, system)
- User-friendly error messages
- LangSmith error reporting

**7.6 trace-helper.js**
- Generate LangSmith tags (`user:123`, `intent:transactional`)
- Generate metadata (traceId, timestamp)
- Helper functions for consistent tracing

**7.7 logger.js**
- Winston logger instance
- Log levels (info, warn, error)
- Structured logging (JSON format)

---

#### **8. Middleware (`src/middleware/`)**

**Purpose**: Express middleware for HTTP concerns

**Modules**:
- **auth.js**: JWT validation, extract userId from token
- **error-handler.js**: Global Express error handler
- **rate-limiter.js**: Rate limiting (100 req/15 min per user)
- **request-logger.js**: Log HTTP requests with trace IDs

---

#### **9. Routes (`src/routes/`)**

**Purpose**: Express route handlers

**chat.js**: Main chat endpoint
```javascript
router.post('/chat', authMiddleware, async (req, res) => {
  // 1. Validate request (Zod)
  // 2. Invoke intent router graph
  // 3. Return response
  // 4. Handle errors
});
```

**upload.js**: PDF upload endpoint
```javascript
router.post('/upload', authMiddleware, upload.single('pdf'), async (req, res) => {
  // 1. Validate file
  // 2. Invoke ingestion pipeline
  // 3. Return confirmation
});
```

**debug.js**: System info endpoint
```javascript
router.get('/debug', async (req, res) => {
  // Return: vectorstore stats, model config, etc.
});
```

---

## 4. Graph Workflow Design

### 4.1 Intent Router Graph

**Purpose**: Main entry point - classify intent and route to appropriate handler

**File**: `src/graphs/intent-router.graph.js`

**State Schema**:
```javascript
const IntentRouterState = z.object({
  // Input
  userMessage: z.string(),
  userId: z.number(),
  authToken: z.string(),
  conversationHistory: z.array(z.any()).default([]),
  
  // Classification
  intent: z.enum(['expense_operation', 'rag_question', 'rag_compare', 'reconciliation', 'general_chat']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  
  // Result
  result: z.string().optional(),
  error: z.string().optional(),
  
  // Metadata
  traceId: z.string().optional(),
  timestamp: z.string().optional()
});
```

**Nodes**:

1. **classifyIntent**
   - Input: `{ userMessage, conversationHistory }`
   - Action: Call LLM with classification prompt
   - Output: `{ intent, confidence }`

2. **handleExpenseOperation**
   - Input: `{ userMessage, authToken, userId, conversationHistory }`
   - Action: Invoke transactional graph (or agent directly)
   - Output: `{ result }`

3. **handleRagQuestion**
   - Input: `{ userMessage, userId }`
   - Action: Invoke RAG Q&A chain
   - Output: `{ result }`

4. **handleRagCompare**
   - Input: `{ userMessage, userId, authToken }`
   - Action: Invoke RAG comparison graph
   - Output: `{ result }`

5. **handleReconciliation**
   - Input: `{ userMessage, userId, authToken }`
   - Action: Invoke reconciliation graph
   - Output: `{ result }`

6. **handleGeneralChat**
   - Input: `{ userMessage }`
   - Action: Simple greeting/help response
   - Output: `{ result }`

**Graph Structure**:
```javascript
const workflow = new StateGraph(IntentRouterState)
  .addNode("classifyIntent", classifyIntent)
  .addNode("handleExpenseOperation", handleExpenseOperation)
  .addNode("handleRagQuestion", handleRagQuestion)
  .addNode("handleRagCompare", handleRagCompare)
  .addNode("handleReconciliation", handleReconciliation)
  .addNode("handleGeneralChat", handleGeneralChat)
  
  // Start with classification
  .addEdge(START, "classifyIntent")
  
  // Conditional routing based on intent
  .addConditionalEdges(
    "classifyIntent",
    (state) => state.intent,
    {
      "expense_operation": "handleExpenseOperation",
      "rag_question": "handleRagQuestion",
      "rag_compare": "handleRagCompare",
      "reconciliation": "handleReconciliation",
      "general_chat": "handleGeneralChat"
    }
  )
  
  // All handlers end workflow
  .addEdge("handleExpenseOperation", END)
  .addEdge("handleRagQuestion", END)
  .addEdge("handleRagCompare", END)
  .addEdge("handleReconciliation", END)
  .addEdge("handleGeneralChat", END);

export const intentRouterGraph = workflow.compile();
```

**Visual Representation**:
```
              START
                │
                ▼
         ┌──────────────┐
         │  CLASSIFY    │
         │  INTENT      │
         └──────┬───────┘
                │
        ┌───────┴───────┬─────────┬─────────────┬─────────────┐
        │               │         │             │             │
        ▼               ▼         ▼             ▼             ▼
  ┌─────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Expense │   │ RAG Q&A  │ │ RAG Comp │ │ Reconcile│ │  General │
  │Operation│   │          │ │          │ │          │ │   Chat   │
  └────┬────┘   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
       │             │            │            │            │
       └─────────────┴────────────┴────────────┴────────────┘
                                  │
                                  ▼
                                 END
```

---

### 4.2 Transactional Graph

**Purpose**: Handle expense CRUD operations via agent

**File**: `src/graphs/transactional.graph.js`

**State Schema**:
```javascript
const TransactionalState = z.object({
  userMessage: z.string(),
  userId: z.number(),
  authToken: z.string(),
  conversationHistory: z.array(z.any()).default([]),
  
  // Agent result
  agentResult: z.any().optional(),
  finalResponse: z.string().optional(),
  
  // Metadata
  toolCalls: z.array(z.any()).default([]),
  tokenUsage: z.number().default(0)
});
```

**Nodes**:

1. **executeAgent**
   - Create expense agent with tools
   - Invoke agent with user message
   - Return agent result

2. **formatResponse**
   - Extract final answer from agent result
   - Format for user display
   - Return formatted response

**Graph Structure**:
```javascript
const workflow = new StateGraph(TransactionalState)
  .addNode("executeAgent", async (state) => {
    const agent = await createExpenseAgent(state.authToken, { userId: state.userId });
    const result = await agent.invoke({
      input: state.userMessage,
      chat_history: state.conversationHistory
    });
    
    return {
      agentResult: result,
      toolCalls: result.intermediateSteps || []
    };
  })
  .addNode("formatResponse", async (state) => {
    return {
      finalResponse: state.agentResult.output
    };
  })
  .addEdge(START, "executeAgent")
  .addEdge("executeAgent", "formatResponse")
  .addEdge("formatResponse", END);

export const transactionalGraph = workflow.compile();
```

**Why Graph Instead of Direct Agent**:
- ✅ Can add pre-processing node (validation)
- ✅ Can add post-processing node (formatting)
- ✅ Traced in LangSmith as graph
- ✅ Easy to extend (add caching, etc.)

---

### 4.3 RAG Q&A Graph

**Purpose**: Answer questions about uploaded PDFs

**File**: `src/graphs/rag-qa.graph.js`

**State Schema**:
```javascript
const RagQAState = z.object({
  userMessage: z.string(),
  userId: z.number(),
  
  // Retrieval
  retrievedDocs: z.array(z.any()).default([]),
  
  // Answer
  answer: z.string().optional(),
  sources: z.array(z.any()).default([]),
  
  // Flags
  hasDocuments: z.boolean().default(false)
});
```

**Nodes**:

1. **checkDocuments**
   - Check if user has uploaded PDFs
   - Update hasDocuments flag

2. **retrieveDocuments**
   - Use retriever to find relevant chunks
   - Store retrieved docs

3. **generateAnswer**
   - Use RetrievalQAChain
   - Generate answer from context
   - Extract sources

4. **respondNoDocuments**
   - Return helpful message about uploading PDFs

**Graph Structure**:
```javascript
const workflow = new StateGraph(RagQAState)
  .addNode("checkDocuments", checkDocuments)
  .addNode("retrieveDocuments", retrieveDocuments)
  .addNode("generateAnswer", generateAnswer)
  .addNode("respondNoDocuments", respondNoDocuments)
  
  .addEdge(START, "checkDocuments")
  
  // Conditional: Has documents?
  .addConditionalEdges(
    "checkDocuments",
    (state) => state.hasDocuments ? "has_docs" : "no_docs",
    {
      "has_docs": "retrieveDocuments",
      "no_docs": "respondNoDocuments"
    }
  )
  
  .addEdge("retrieveDocuments", "generateAnswer")
  .addEdge("generateAnswer", END)
  .addEdge("respondNoDocuments", END);

export const ragQaGraph = workflow.compile();
```

**Visual**:
```
      START
        │
        ▼
   ┌────────────┐
   │   CHECK    │
   │ DOCUMENTS  │
   └─────┬──────┘
         │
     ┌───┴───┐
     │       │
  has_docs  no_docs
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│RETRIEVE │ │ RESPOND  │
└────┬────┘ │ NO DOCS  │
     │      └────┬─────┘
     ▼           │
┌─────────┐      │
│GENERATE │      │
│ ANSWER  │      │
└────┬────┘      │
     └───────────┘
         │
         ▼
        END
```

**Alternative**: Could use RetrievalQAChain directly without graph
- **Use Graph**: If you want pre/post-processing, conditional logic, LangSmith visualization
- **Use Chain**: If you want simplicity and it's a linear flow

**Recommendation**: Start with Chain, migrate to Graph if complexity increases

---

### 4.4 RAG Comparison Graph

**Purpose**: Compare PDF expenses with app expenses using deterministic logic

**File**: `src/graphs/rag-compare.graph.js`

**State Schema**:
```javascript
const RagCompareState = z.object({
  userMessage: z.string(),
  userId: z.number(),
  authToken: z.string(),
  
  // Extracted expenses
  pdfExpenses: z.array(z.any()).default([]),
  appExpenses: z.array(z.any()).default([]),
  
  // Comparison result
  diff: z.object({
    matched: z.array(z.any()),
    pdfOnly: z.array(z.any()),
    appOnly: z.array(z.any()),
    summary: z.any()
  }).optional(),
  
  // LLM explanation
  explanation: z.string().optional()
});
```

**Nodes**:

1. **extractPdfExpenses**
   - Retrieve all chunks for userId from vector store
   - Use regex-based extractor (deterministic)
   - Return pdfExpenses

2. **fetchAppExpenses**
   - Call backend GET /expenses
   - Return appExpenses

3. **compareExpenses**
   - Use comparison orchestrator (deterministic)
   - Generate diff (matched, pdfOnly, appOnly)
   - Return diff

4. **explainDiff**
   - Use LLM to generate natural language explanation
   - Include summary statistics
   - Return explanation

**Graph Structure**:
```javascript
const workflow = new StateGraph(RagCompareState)
  .addNode("extractPdfExpenses", extractPdfExpenses)
  .addNode("fetchAppExpenses", fetchAppExpenses)
  .addNode("compareExpenses", compareExpenses)
  .addNode("explainDiff", explainDiff)
  
  .addEdge(START, "extractPdfExpenses")
  .addEdge(START, "fetchAppExpenses")  // Parallel!
  
  // Wait for both to complete
  .addEdge("extractPdfExpenses", "compareExpenses")
  .addEdge("fetchAppExpenses", "compareExpenses")
  
  .addEdge("compareExpenses", "explainDiff")
  .addEdge("explainDiff", END);

export const ragCompareGraph = workflow.compile();
```

**Visual**:
```
           START
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
  ┌────────┐  ┌────────┐
  │ EXTRACT│  │  FETCH │
  │  PDF   │  │  APP   │
  └───┬────┘  └───┬────┘
      └─────┬─────┘
            ▼
       ┌─────────┐
       │ COMPARE │
       │(Determ.)│
       └────┬────┘
            ▼
       ┌─────────┐
       │ EXPLAIN │
       │  (LLM)  │
       └────┬────┘
            ▼
           END
```

**Key Feature**: Parallel execution of extractPdfExpenses and fetchAppExpenses
- ✅ LangGraph automatically waits for both before running compareExpenses
- ✅ Reduces latency by ~50%

---

### 4.5 Reconciliation Graph

**Purpose**: 6-stage workflow to sync PDF expenses to app

**File**: `src/graphs/reconciliation.graph.js`

**State Schema**:
```javascript
const ReconciliationState = z.object({
  userMessage: z.string(),
  userId: z.number(),
  authToken: z.string(),
  
  // Stage 1: Compare
  diff: z.any().optional(),
  
  // Stage 2: Plan
  plan: z.object({
    add_to_app: z.array(z.any()),
    add_to_pdf: z.array(z.any()),
    ignored: z.array(z.any()),
    rejected: z.array(z.any()),
    summary: z.any()
  }).optional(),
  
  // Stage 3: Validate
  validationResult: z.object({
    valid: z.boolean(),
    error: z.string().optional()
  }).optional(),
  
  // Stage 4: Sync
  syncSummary: z.object({
    succeeded: z.number(),
    failed: z.number(),
    errors: z.array(z.any())
  }).optional(),
  
  // Stage 5: Report
  reportResult: z.object({
    csvPath: z.string(),
    htmlPath: z.string()
  }).optional(),
  
  // Stage 6: Respond
  finalResponse: z.string().optional(),
  
  // Error handling
  error: z.string().optional()
});
```

**Nodes**:

1. **compareStage**
   - Invoke RAG comparison graph
   - Return diff

2. **planStage**
   - Use reconciliation planner (deterministic)
   - Apply business rules
   - Return plan

3. **validateStage**
   - Validate plan (amount thresholds, duplicates)
   - Return validationResult

4. **syncStage**
   - Execute plan using CreateExpenseTool
   - Collect success/failure results
   - Return syncSummary

5. **reportStage**
   - Generate CSV and HTML reports
   - Save to disk
   - Return file paths

6. **respondStage**
   - Format response message for user
   - Include summary statistics
   - Return finalResponse

7. **respondError**
   - Handle validation failures
   - Return error message

**Graph Structure**:
```javascript
const workflow = new StateGraph(ReconciliationState)
  .addNode("compareStage", compareStage)
  .addNode("planStage", planStage)
  .addNode("validateStage", validateStage)
  .addNode("syncStage", syncStage)
  .addNode("reportStage", reportStage)
  .addNode("respondStage", respondStage)
  .addNode("respondError", respondError)
  
  .addEdge(START, "compareStage")
  .addEdge("compareStage", "planStage")
  .addEdge("planStage", "validateStage")
  
  // Conditional: Validation passed?
  .addConditionalEdges(
    "validateStage",
    (state) => state.validationResult.valid ? "valid" : "invalid",
    {
      "valid": "syncStage",
      "invalid": "respondError"
    }
  )
  
  .addEdge("syncStage", "reportStage")
  .addEdge("reportStage", "respondStage")
  .addEdge("respondStage", END)
  .addEdge("respondError", END);

export const reconciliationGraph = workflow.compile();
```

**Visual**:
```
        START
          │
          ▼
     ┌─────────┐
     │COMPARE  │ (Invoke comparison graph)
     └────┬────┘
          ▼
     ┌─────────┐
     │  PLAN   │ (Deterministic rules)
     └────┬────┘
          ▼
     ┌─────────┐
     │VALIDATE │ (Pre-flight checks)
     └────┬────┘
          │
      ┌───┴───┐
   valid    invalid
      │         │
      ▼         ▼
  ┌──────┐  ┌───────┐
  │ SYNC │  │ ERROR │
  └──┬───┘  │RESPOND│
     ▼      └───┬───┘
  ┌──────┐      │
  │REPORT│      │
  └──┬───┘      │
     ▼          │
  ┌──────┐      │
  │RESPOND│     │
  └──┬───┘      │
     └──────────┘
          │
          ▼
         END
```

**Benefits of Graph for Reconciliation**:
- ✅ **Visibility**: See which stage failed in LangSmith
- ✅ **State Persistence**: Can inspect state at each stage
- ✅ **Error Recovery**: Could add retry logic per stage
- ✅ **Testing**: Test each stage independently
- ✅ **Modification**: Easy to add new stages (e.g., "confirmationStage")

---

## 5. State Object Design

### 5.1 State Design Principles

1. **Immutability**: Nodes return updates, don't mutate state
2. **Type Safety**: Use Zod schemas for validation
3. **Minimal State**: Only include what's needed
4. **Clear Naming**: Self-documenting field names

### 5.2 Common State Patterns

#### Pattern 1: Input State
```javascript
const InputState = z.object({
  userMessage: z.string(),
  userId: z.number(),
  authToken: z.string(),
  conversationHistory: z.array(z.any()).default([])
});
```

#### Pattern 2: Progress State
```javascript
const ProgressState = InputState.extend({
  step: z.enum(['started', 'processing', 'completed']),
  currentStage: z.string().optional()
});
```

#### Pattern 3: Result State
```javascript
const ResultState = InputState.extend({
  result: z.string().optional(),
  error: z.string().optional(),
  metadata: z.any().optional()
});
```

#### Pattern 4: Conditional State
```javascript
const ConditionalState = InputState.extend({
  condition: z.boolean(),
  branchTaken: z.string().optional()
});
```

### 5.3 State Update Pattern

**Node Function**:
```javascript
const myNode = async (state) => {
  // 1. Read from state
  const { userMessage, userId } = state;
  
  // 2. Perform operations
  const result = await doSomething(userMessage, userId);
  
  // 3. Return ONLY updates (not entire state)
  return {
    result: result.data,
    metadata: { timestamp: new Date().toISOString() }
  };
  
  // StateGraph merges this with existing state automatically
};
```

### 5.4 State Reducer Pattern (Optional)

For complex state updates, use reducer:
```javascript
const workflow = new StateGraph(MyState, {
  reducer: (existingState, updates) => {
    // Custom merge logic
    return { ...existingState, ...updates };
  }
});
```

---

## 6. Tool Wrapper Design

### 6.1 Tool Architecture

**Base Pattern**:
```javascript
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export class MyTool extends StructuredTool {
  // Required properties
  name = "my_tool";
  description = "Description for LLM...";
  schema = MyToolSchema;  // Zod schema
  
  // Context via constructor
  constructor(authToken, context = {}) {
    super();
    this.authToken = authToken;
    this.userId = context.userId;
    this.traceId = context.traceId;
  }
  
  // Implementation
  async _call(args) {
    // 1. Normalize inputs
    // 2. Validate business rules
    // 3. Call backend API
    // 4. Format result
    // 5. Handle errors
  }
}
```

### 6.2 CreateExpenseTool (Full Example)

**File**: `src/tools/createExpense.tool.js`

```javascript
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { backendClient } from "../utils/backend-client.js";
import { normalizeCategory } from "../utils/category-cache.js";
import { normalizeDateToISO } from "../utils/date-normalizer.js";
import { validateAmount } from "../utils/validators.js";

// Zod Schema
const CreateExpenseSchema = z.object({
  amount: z
    .number()
    .positive()
    .describe("Amount in numbers only (e.g., 200, 50.5, 1234.56)"),
  
  category: z
    .string()
    .min(1)
    .describe("Category name exactly as mentioned by user (e.g., 'food', 'groceries', 'transport')"),
  
  description: z
    .string()
    .default("")
    .describe("Optional description of the expense"),
  
  date: z
    .string()
    .optional()
    .describe("Date in natural language (e.g., 'today', 'yesterday', '2024-01-15') or YYYY-MM-DD format")
});

export class CreateExpenseTool extends StructuredTool {
  name = "create_expense";
  
  description = `Add a new expense to the user's expense tracker.
  
Use this tool when the user wants to:
- Add/create/log/record a new expense
- Track spending
- Save an expense

Examples:
- "Add 500 for lunch today"
- "I spent 1200 on groceries yesterday"
- "Create expense for 75 rupees on transport"

Returns: Confirmation message with expense details.`;

  schema = CreateExpenseSchema;
  
  constructor(authToken, context = {}) {
    super();
    this.authToken = authToken;
    this.userId = context.userId;
    this.traceId = context.traceId;
  }
  
  async _call(args) {
    try {
      // Step 1: Normalize inputs
      const normalizedCategory = await normalizeCategory(args.category, this.authToken);
      const normalizedDate = normalizeDateToISO(args.date || 'today');
      
      // Step 2: Validate business rules
      const validatedAmount = validateAmount(args.amount);
      
      // Step 3: Prepare payload
      const payload = {
        amount: validatedAmount,
        category_id: normalizedCategory.id,
        description: args.description || `Expense for ${normalizedCategory.name}`,
        date: normalizedDate
      };
      
      // Step 4: Call backend API
      const response = await backendClient.post('/expenses', payload, this.authToken);
      
      // Step 5: Format result for LLM
      if (response.success) {
        return JSON.stringify({
          success: true,
          message: `Expense of ₹${validatedAmount} for ${normalizedCategory.name} added successfully on ${normalizedDate}.`,
          expense: response.expense
        });
      } else {
        throw new Error(response.error || 'Failed to create expense');
      }
      
    } catch (error) {
      // Step 6: Error handling
      return JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while creating the expense.'
      });
    }
  }
}
```

### 6.3 Tool Factory Pattern

**File**: `src/tools/index.js`

```javascript
import { CreateExpenseTool } from './createExpense.tool.js';
import { ListExpensesTool } from './listExpenses.tool.js';
import { ModifyExpenseTool } from './modifyExpense.tool.js';
import { DeleteExpenseTool } from './deleteExpense.tool.js';
import { ClearExpensesTool } from './clearExpenses.tool.js';

export const createToolsWithContext = (authToken, context = {}) => {
  return [
    new CreateExpenseTool(authToken, context),
    new ListExpensesTool(authToken, context),
    new ModifyExpenseTool(authToken, context),
    new DeleteExpenseTool(authToken, context),
    new ClearExpensesTool(authToken, context)
  ];
};

export const getToolByName = (name, authToken, context) => {
  const tools = createToolsWithContext(authToken, context);
  return tools.find(tool => tool.name === name);
};
```

**Usage in Agent**:
```javascript
const tools = createToolsWithContext(authToken, { userId, traceId });
const agent = createOpenAIToolsAgent({ llm, tools, prompt });
```

### 6.4 Tool Design Best Practices

| Aspect | Best Practice |
|--------|--------------|
| **Name** | Snake_case, descriptive (e.g., `create_expense`, not `add`) |
| **Description** | Clear purpose, examples, expected output |
| **Schema** | Use Zod with `.describe()` for each field |
| **Validation** | Zod for types, custom functions for business rules |
| **Normalization** | Always normalize (category names, dates, etc.) |
| **Error Handling** | Return JSON with success flag, never throw |
| **Result Format** | JSON string for structured data |
| **Context** | Inject via constructor, not as tool argument |
| **Testing** | Unit test `_call()` method with mock backend |

---

## 7. RAG Pipeline Architecture

### 7.1 RAG Components

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INGESTION                                                   │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌─────────────┐   │
│  │  PDF   │──▶│ CHUNK  │──▶│ EMBED  │──▶│   STORE     │   │
│  │ Extract│   │  Text  │   │        │   │(MemoryVector│   │
│  └────────┘   └────────┘   └────────┘   └─────────────┘   │
│  pdf-parse    RecursiveCharacterTextSplitter  OpenAI       │
│                                                              │
│  RETRIEVAL                                                   │
│  ┌────────┐   ┌────────┐   ┌────────┐                      │
│  │ Query  │──▶│ Embed  │──▶│ Search │──▶ Top-K Docs        │
│  └────────┘   └────────┘   └────────┘                      │
│                OpenAI       Cosine Similarity               │
│                                                              │
│  GENERATION                                                  │
│  ┌────────┐   ┌────────┐   ┌────────┐                      │
│  │Context │──▶│ Prompt │──▶│  LLM   │──▶ Answer            │
│  │Builder │   │Template│   │        │                      │
│  └────────┘   └────────┘   └────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Ingestion Pipeline

**File**: `src/rag/ingestion/ingest.js`

```javascript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { extractTextFromPDF } from "./pdf.processor.js";
import { getVectorStore } from "../vectorstore/index.js";

export const ingestPDF = async (pdfBuffer, filename, userId) => {
  // Step 1: Extract text from PDF
  const { text, metadata: pdfMetadata } = await extractTextFromPDF(pdfBuffer);
  
  // Step 2: Chunk text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ".", " ", ""]
  });
  
  const chunks = await splitter.createDocuments(
    [text],
    [{
      filename,
      userId,
      uploadedAt: new Date().toISOString(),
      ...pdfMetadata
    }]
  );
  
  // Step 3: Add to vector store (automatic embedding)
  const vectorStore = await getVectorStore();
  const ids = await vectorStore.addDocuments(chunks);
  
  // Step 4: Save vector store to disk
  await saveVectorStore();
  
  return {
    success: true,
    documentId: ids[0],  // First chunk ID as document ID
    chunksCount: chunks.length,
    filename
  };
};
```

**PDF Processor**:
```javascript
// src/rag/ingestion/pdf.processor.js
import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (pdfBuffer) => {
  const data = await pdfParse(pdfBuffer);
  
  return {
    text: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info
    }
  };
};
```

**Text Splitter Configuration**:
- **chunkSize: 1500**: Balance between context and relevance
- **chunkOverlap: 200**: Preserve context across chunk boundaries
- **separators**: Prioritize natural boundaries (paragraphs, sentences)

### 7.3 Vector Store Management

**File**: `src/rag/vectorstore/memory.store.js`

```javascript
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createEmbeddings } from "../embeddings/index.js";
import fs from "fs/promises";

const VECTOR_STORE_FILE = "./data/vectorstore/memory-store.json";
let vectorStoreInstance = null;

export const getVectorStore = async () => {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }
  
  const embeddings = createEmbeddings();
  
  // Try loading from disk
  try {
    const exists = await fs.access(VECTOR_STORE_FILE).then(() => true).catch(() => false);
    
    if (exists) {
      vectorStoreInstance = await loadVectorStore();
    } else {
      vectorStoreInstance = new MemoryVectorStore(embeddings);
    }
  } catch (error) {
    console.error('Error loading vector store, creating new:', error);
    vectorStoreInstance = new MemoryVectorStore(embeddings);
  }
  
  return vectorStoreInstance;
};

export const saveVectorStore = async () => {
  if (!vectorStoreInstance) return;
  
  const data = {
    memoryVectors: vectorStoreInstance.memoryVectors,
    // Serialize other necessary fields
  };
  
  await fs.mkdir("./data/vectorstore", { recursive: true });
  await fs.writeFile(VECTOR_STORE_FILE, JSON.stringify(data, null, 2));
};

export const loadVectorStore = async () => {
  const data = JSON.parse(await fs.readFile(VECTOR_STORE_FILE, 'utf-8'));
  const embeddings = createEmbeddings();
  
  const store = new MemoryVectorStore(embeddings);
  store.memoryVectors = data.memoryVectors;
  
  return store;
};

export const getUserDocumentCount = async (userId) => {
  const store = await getVectorStore();
  const allDocs = store.memoryVectors || [];
  
  return allDocs.filter(vec => vec.metadata?.userId === userId).length;
};
```

**Why MemoryVectorStore (for now)**:
- ✅ Simple for MVP
- ✅ No external dependencies
- ✅ Disk persistence supported
- ✅ Easy to swap later (Pinecone, Chroma, etc.)

**Future Migration Path**:
```javascript
// Just change this file:
import { PineconeStore } from "langchain/vectorstores/pinecone";

export const getVectorStore = async () => {
  if (vectorStoreInstance) return vectorStoreInstance;
  
  const embeddings = createEmbeddings();
  const pineconeIndex = await initPinecone();
  
  vectorStoreInstance = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: 'expense-tracker'
  });
  
  return vectorStoreInstance;
};
```

### 7.4 Retrieval Configuration

**File**: `src/rag/retrieval/retriever.js`

```javascript
import { getVectorStore } from "../vectorstore/index.js";

export const createRetriever = async (userId, options = {}) => {
  const {
    k = 5,
    searchType = "similarity",
    scoreThreshold = 0.3
  } = options;
  
  const vectorStore = await getVectorStore();
  
  const retriever = vectorStore.asRetriever({
    k,
    searchType,
    filter: (doc) => doc.metadata && doc.metadata.userId === userId,
    callbacks: [/* LangSmith callbacks */]
  });
  
  return retriever;
};
```

**Search Options**:
- **k=5**: Return top 5 chunks (balance between context and noise)
- **searchType="similarity"**: Cosine similarity (default)
- **scoreThreshold=0.3**: Minimum relevance score
- **filter**: User isolation (critical for multi-tenant)

### 7.5 QA Chain

**File**: `src/rag/chains/qa.chain.js`

```javascript
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createRetriever } from "../retrieval/retriever.js";
import { getTraceTags, getTraceMetadata } from "../../utils/trace-helper.js";

export const createQAChain = async (userId, context = {}) => {
  const { modelName = "gpt-4o-mini", temperature = 0 } = context;
  
  // Create retriever
  const retriever = await createRetriever(userId, { k: 5 });
  
  // Create LLM
  const llm = new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
    tags: getTraceTags('rag_qa', userId),
    metadata: getTraceMetadata(context.traceId, userId)
  });
  
  // Create prompt
  const qaPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping analyze expense documents.

Use the following context from the user's uploaded PDF documents to answer the question.
If the answer is not in the context, say "I don't have enough information in your uploaded documents to answer that."

Context:
{context}

Question: {question}

Answer:`);
  
  // Create chain
  const chain = RetrievalQAChain.fromLLM(llm, retriever, {
    prompt: qaPrompt,
    returnSourceDocuments: true,
    verbose: process.env.NODE_ENV === 'development'
  });
  
  return chain;
};

export const answerQuestion = async (question, userId, context = {}) => {
  const chain = await createQAChain(userId, context);
  
  const result = await chain.call({ query: question });
  
  return {
    answer: result.text,
    sources: result.sourceDocuments.map(doc => ({
      filename: doc.metadata.filename,
      snippet: doc.pageContent.substring(0, 200) + '...',
      relevanceScore: doc.metadata.score || null
    }))
  };
};
```

**Chain Benefits**:
- ✅ Automatic retrieval → context building → LLM call
- ✅ Source document tracking
- ✅ LangSmith auto-tracing
- ✅ Configurable prompt

---

## 8. Observability with LangSmith

### 8.1 LangSmith Setup

**File**: `src/config/langsmith.config.js`

```javascript
export const LANGSMITH_CONFIG = {
  ENABLED: process.env.LANGCHAIN_TRACING_V2 === 'true',
  API_KEY: process.env.LANGCHAIN_API_KEY,
  PROJECT: process.env.LANGCHAIN_PROJECT || 'expense-tracker-ai-langx',
  ENDPOINT: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com'
};

// Validate configuration
export const validateLangSmith = () => {
  if (LANGSMITH_CONFIG.ENABLED && !LANGSMITH_CONFIG.API_KEY) {
    console.warn('LangSmith tracing enabled but LANGCHAIN_API_KEY not set');
    return false;
  }
  return true;
};
```

**Environment Variables** (`.env`):
```bash
# LangSmith Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_abc123...
LANGCHAIN_PROJECT=expense-tracker-ai-langx
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 8.2 Trace Helper Functions

**File**: `src/utils/trace-helper.js`

```javascript
import { v4 as uuidv4 } from 'uuid';

export const generateTraceId = () => {
  return `trace_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

export const getTraceTags = (intent, userId) => {
  return [
    'expense-tracker',
    `intent:${intent}`,
    `user:${userId}`,
    `env:${process.env.NODE_ENV || 'development'}`
  ];
};

export const getTraceMetadata = (traceId, userId, additionalMeta = {}) => {
  return {
    traceId,
    userId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    ...additionalMeta
  };
};
```

### 8.3 Applying Tracing to Components

#### **LLM Calls**:
```javascript
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  tags: getTraceTags('transactional', userId),
  metadata: getTraceMetadata(traceId, userId)
});
```

#### **Agent Executor**:
```javascript
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  tags: getTraceTags('transactional', userId),
  metadata: getTraceMetadata(traceId, userId, { sessionId: 'abc123' })
});
```

#### **Chains**:
```javascript
const chain = RetrievalQAChain.fromLLM(llm, retriever, {
  tags: getTraceTags('rag_qa', userId),
  metadata: getTraceMetadata(traceId, userId)
});
```

#### **Graphs**:
```javascript
const result = await intentRouterGraph.invoke(
  { userMessage, userId, authToken },
  {
    tags: getTraceTags('intent_router', userId),
    metadata: getTraceMetadata(traceId, userId)
  }
);
```

### 8.4 What Gets Traced Automatically

**With Zero Extra Code**:
- ✅ Every LLM call (input, output, tokens, latency, cost)
- ✅ Every tool execution (name, args, result, duration)
- ✅ Every chain step (retrieval, prompt, generation)
- ✅ Every graph node (state before/after, transitions)
- ✅ Errors with full context
- ✅ Token usage aggregation
- ✅ Cost calculation

**LangSmith Dashboard Views**:

1. **Trace Explorer**
   - Interactive tree view of execution
   - Click any node to see I/O
   - Drill down into nested calls
   - Time spent per step

2. **Analytics**
   - Latency percentiles (p50, p95, p99)
   - Cost per intent type
   - Success/failure rates
   - Token usage trends

3. **Filtering**
   - By tags: `intent:transactional`, `user:123`
   - By metadata: `environment:production`
   - By status: success, error, timeout
   - By date range

4. **Comparison**
   - Side-by-side trace comparison
   - A/B test different prompts
   - Compare performance across versions

### 8.5 Custom Callbacks (Optional)

For advanced use cases:
```javascript
import { BaseCallbackHandler } from "langchain/callbacks";

class CustomCallbackHandler extends BaseCallbackHandler {
  name = "custom_handler";
  
  async handleLLMStart(llm, prompts) {
    console.log('LLM started with prompts:', prompts);
  }
  
  async handleLLMEnd(output) {
    console.log('LLM completed:', output);
  }
  
  async handleToolStart(tool, input) {
    console.log(`Tool ${tool.name} started with:`, input);
  }
  
  async handleToolEnd(output) {
    console.log('Tool completed:', output);
  }
}

// Use:
const llm = new ChatOpenAI({
  callbacks: [new CustomCallbackHandler()]
});
```

**When to Use Custom Callbacks**:
- Log to external systems (Datadog, New Relic)
- Real-time monitoring dashboards
- Custom analytics
- Alert triggers

---

## 9. LangGraph vs Agents Decision

### 9.1 Problem Statement

**Question**: When should we use LangGraph instead of AgentExecutor?

### 9.2 Decision Matrix

| Scenario | Use LangGraph | Use AgentExecutor | Rationale |
|----------|--------------|------------------|-----------|
| **Tool-calling with flexible order** | ❌ | ✅ | Agent decides tool sequence |
| **Multi-stage deterministic workflow** | ✅ | ❌ | Explicit stage control needed |
| **Conditional branching** | ✅ | ❌ | Graph conditional edges |
| **Need to visualize workflow** | ✅ | ❌ | LangSmith graph view |
| **State persistence crucial** | ✅ | ❌ | State object tracks progress |
| **Mix LLM + deterministic logic** | ✅ | ❌ | Separate nodes for each |
| **Simple NL → tool → response** | ❌ | ✅ | Agent is simpler |
| **Need to resume from failure** | ✅ | ❌ | Graph state can be restored |
| **Parallel execution required** | ✅ | ❌ | Graph parallel edges |

### 9.3 Usage in Our Architecture

#### Use AgentExecutor:
- **Transactional Operations** (create/list/modify/delete expenses)
  - User input is natural language
  - LLM needs to choose which tool(s) to call
  - Order is flexible
  - Example: "Add 500 for lunch and show me today's expenses"

#### Use LangGraph:
- **Intent Classification** (route to handlers)
  - Deterministic routing logic
  - Visualization helpful
  
- **RAG Comparison** (compare PDF vs App)
  - Multi-stage: extract → fetch → compare → explain
  - Parallel execution (extract + fetch)
  - Mix deterministic (comparison) + LLM (explanation)
  
- **Reconciliation** (6-stage sync)
  - Explicit stage control
  - Conditional branching (validation pass/fail)
  - State persistence critical
  - Needs visualization for debugging

### 9.4 Hybrid Pattern (Best of Both)

**Use Graph to Wrap Agent**:
```javascript
const transactionalGraph = new StateGraph(State)
  .addNode("validateInput", validateInput)  // Deterministic
  .addNode("executeAgent", async (state) => {
    const agent = createExpenseAgent(state.authToken, state);
    return await agent.invoke({ input: state.userMessage });
  })
  .addNode("formatResponse", formatResponse)  // Deterministic
  
  .addEdge(START, "validateInput")
  .addEdge("validateInput", "executeAgent")
  .addEdge("executeAgent", "formatResponse")
  .addEdge("formatResponse", END);
```

**Benefits**:
- ✅ Pre-processing (validation) in graph node
- ✅ Agent flexibility for tool-calling
- ✅ Post-processing (formatting) in graph node
- ✅ Full workflow traced in LangSmith

---

## 10. Deterministic Orchestration

### 10.1 What Should Remain Deterministic

**Principle**: Financial business logic must be deterministic, auditable, and testable

#### Components That MUST Be Deterministic:

1. **Expense Comparison Algorithm**
   - Jaccard similarity calculation
   - Matching rules (amount, date, description)
   - Diff generation
   - **Why**: Reproducible results, audit trail

2. **Reconciliation Planning**
   - Validation rules (MIN_AMOUNT, MAX_AMOUNT)
   - Duplicate detection
   - Plan generation
   - **Why**: Financial compliance, no hallucinations

3. **Amount Validation**
   - Range checks (>0, <MAX_AMOUNT)
   - Decimal precision
   - **Why**: Data integrity

4. **Date Normalization**
   - Parse "today", "yesterday"
   - Convert to ISO format
   - **Why**: Consistent storage

5. **Category Normalization**
   - Fuzzy matching (optional)
   - ID lookup
   - **Why**: Consistent categorization

6. **Expense Extraction from PDF**
   - Regex patterns for amounts, dates
   - **Why**: Reliable extraction, no LLM cost

#### Components That CAN Use LLM:

1. **Intent Classification**
   - Understand user intent from natural language
   - **Why**: Flexibility, handles variety of inputs

2. **Natural Language Interface**
   - Parse user messages
   - Extract entities (optional)
   - **Why**: Better UX

3. **Response Generation**
   - Format results as natural language
   - **Why**: Conversational interface

4. **Explanation Generation**
   - Explain comparison results
   - **Why**: User-friendly explanations

### 10.2 Orchestrator Pattern

**File Structure**:
```
src/orchestrators/
├── comparison/
│   ├── comparator.js       # Pure function: compareExpenses()
│   ├── matcher.js          # Pure function: matchExpense()
│   └── diff.js             # Pure function: generateDiff()
│
├── reconciliation/
│   ├── planner.js          # Pure function: createPlan()
│   ├── validator.js        # Pure function: validatePlan()
│   ├── executor.js         # Async I/O: executePlan()
│   └── reporter.js         # Async I/O: generateReport()
│
└── extraction/
    ├── expense.extractor.js # Pure function: extractExpenses()
    └── patterns.js          # Constants: AMOUNT_PATTERN, DATE_PATTERN
```

**Example**: Comparison Orchestrator

```javascript
// src/orchestrators/comparison/comparator.js

/**
 * Compare two sets of expenses and generate a diff.
 * Pure function - no I/O, no LLM, fully deterministic.
 */
export function compareExpenses(pdfExpenses, appExpenses) {
  const matched = [];
  const pdfOnly = [];
  const appOnly = [];
  
  const unmatchedApp = new Set(appExpenses.map(e => e.id));
  
  for (const pdfExpense of pdfExpenses) {
    const match = findMatch(pdfExpense, appExpenses);
    
    if (match) {
      matched.push({ pdf: pdfExpense, app: match });
      unmatchedApp.delete(match.id);
    } else {
      pdfOnly.push(pdfExpense);
    }
  }
  
  appOnly.push(...appExpenses.filter(e => unmatchedApp.has(e.id)));
  
  return {
    matched,
    pdfOnly,
    appOnly,
    summary: {
      totalMatched: matched.length,
      totalPdfOnly: pdfOnly.length,
      totalAppOnly: appOnly.length
    }
  };
}

function findMatch(pdfExpense, appExpenses) {
  for (const appExpense of appExpenses) {
    const amountMatch = Math.abs(pdfExpense.amount - appExpense.amount) <= 1.0;
    const dateMatch = pdfExpense.date === appExpense.date;
    const descSimilarity = jaccardSimilarity(pdfExpense.description, appExpense.description);
    
    if (amountMatch && dateMatch && descSimilarity >= 0.5) {
      return appExpense;
    }
  }
  return null;
}

function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}
```

**Testing**:
```javascript
// tests/unit/orchestrators/comparison.test.js

import { compareExpenses } from '../../../src/orchestrators/comparison/comparator.js';

describe('compareExpenses', () => {
  it('should match expenses with same amount, date, and similar description', () => {
    const pdfExpenses = [
      { amount: 500, date: '2024-01-15', description: 'Lunch at restaurant' }
    ];
    
    const appExpenses = [
      { id: 1, amount: 500, date: '2024-01-15', description: 'Restaurant lunch' }
    ];
    
    const result = compareExpenses(pdfExpenses, appExpenses);
    
    expect(result.matched).toHaveLength(1);
    expect(result.pdfOnly).toHaveLength(0);
    expect(result.appOnly).toHaveLength(0);
  });
  
  // More test cases...
});
```

**Benefits**:
- ✅ **Testable**: No mocks needed, pure input/output
- ✅ **Fast**: No I/O, runs in milliseconds
- ✅ **Reliable**: Deterministic results
- ✅ **Auditable**: Code review verifies logic
- ✅ **Reusable**: Can use outside LangChain context

### 10.3 Integration Pattern

**How Graphs Use Orchestrators**:

```javascript
// src/graphs/rag-compare.graph.js

import { compareExpenses } from '../orchestrators/comparison/comparator.js';

const compareNode = async (state) => {
  const { pdfExpenses, appExpenses } = state;
  
  // Call deterministic orchestrator
  const diff = compareExpenses(pdfExpenses, appExpenses);
  
  return { diff };
};

const explainNode = async (state) => {
  const { diff } = state;
  
  // Use LLM for natural language explanation
  const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
  const explanation = await llm.invoke(`Explain this expense comparison: ${JSON.stringify(diff)}`);
  
  return { explanation: explanation.content };
};

const workflow = new StateGraph(State)
  .addNode("compare", compareNode)      // Deterministic
  .addNode("explain", explainNode)      // LLM-based
  .addEdge(START, "compare")
  .addEdge("compare", "explain")
  .addEdge("explain", END);
```

**Separation of Concerns**:
- **Orchestrator**: Business logic (pure functions)
- **Graph Node**: Invoke orchestrator + handle I/O
- **LLM**: Natural language interfaces only

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1)

#### 1.1 Project Setup
- [ ] Initialize `ai-langx/` folder
- [ ] Install dependencies (LangChain, LangGraph, LangSmith)
- [ ] Set up TypeScript/ESM configuration
- [ ] Create folder structure
- [ ] Configure environment variables
- [ ] Set up LangSmith project

#### 1.2 Core Utilities
- [ ] Implement `backend-client.js`
- [ ] Implement `category-cache.js`
- [ ] Implement `date-normalizer.js`
- [ ] Implement `validators.js` (Zod schemas)
- [ ] Implement `error-handler.js`
- [ ] Implement `trace-helper.js`
- [ ] Implement `logger.js` (Winston)

#### 1.3 Deterministic Orchestrators
- [ ] Implement comparison orchestrator
- [ ] Implement reconciliation planner
- [ ] Implement expense extractor
- [ ] Write unit tests for all orchestrators

**Deliverable**: Foundation layer with 100% test coverage

---

### Phase 2: Tools & RAG (Week 2)

#### 2.1 Tool System
- [ ] Implement `CreateExpenseTool`
- [ ] Implement `ListExpensesTool`
- [ ] Implement `ModifyExpenseTool`
- [ ] Implement `DeleteExpenseTool`
- [ ] Implement `ClearExpensesTool`
- [ ] Implement tool factory
- [ ] Write unit tests for all tools

#### 2.2 RAG Pipeline
- [ ] Implement vector store wrapper (MemoryVectorStore)
- [ ] Implement embeddings configuration
- [ ] Implement PDF processor
- [ ] Implement text chunker
- [ ] Implement ingestion pipeline
- [ ] Implement retriever configuration
- [ ] Implement QA chain
- [ ] Test ingestion + retrieval end-to-end

**Deliverable**: Functional tools and RAG pipeline

---

### Phase 3: Graphs (Week 3)

#### 3.1 Simple Graphs
- [ ] Implement intent router graph
- [ ] Implement transactional graph (with agent)
- [ ] Test intent classification accuracy
- [ ] Test tool-calling via agent

#### 3.2 RAG Graphs
- [ ] Implement RAG Q&A graph
- [ ] Implement RAG comparison graph
- [ ] Test question answering
- [ ] Test comparison workflow

#### 3.3 Complex Graph
- [ ] Implement reconciliation graph (6 stages)
- [ ] Test each stage independently
- [ ] Test full reconciliation flow

**Deliverable**: All graphs implemented and tested

---

### Phase 4: Integration (Week 4)

#### 4.1 Express Server
- [ ] Implement Express server (`server.js`)
- [ ] Implement middleware (auth, error handling, rate limiting)
- [ ] Implement routes (chat, upload, debug)
- [ ] Connect routes to graphs

#### 4.2 End-to-End Testing
- [ ] Test `/ai/chat` with all intent types
- [ ] Test `/ai/upload` with sample PDFs
- [ ] Test error scenarios
- [ ] Test with real backend

#### 4.3 Observability
- [ ] Verify LangSmith tracing works
- [ ] Set up LangSmith dashboard filters
- [ ] Configure tags and metadata
- [ ] Test error reporting

**Deliverable**: Fully functional AI layer

---

### Phase 5: Production Hardening (Week 5)

#### 5.1 Performance
- [ ] Add response caching (optional)
- [ ] Optimize vector search
- [ ] Add request queueing (optional)
- [ ] Load testing

#### 5.2 Reliability
- [ ] Add circuit breakers for backend calls
- [ ] Add retry logic for transient failures
- [ ] Add graceful degradation
- [ ] Test failure scenarios

#### 5.3 Security
- [ ] Audit JWT validation
- [ ] Add input sanitization
- [ ] Add rate limiting per user
- [ ] Security scan (npm audit)

#### 5.4 Documentation
- [ ] API documentation (OpenAPI spec)
- [ ] Graph workflow diagrams
- [ ] Deployment guide
- [ ] Runbook for operations

**Deliverable**: Production-ready system

---

### Phase 6: Deployment & Monitoring (Week 6)

#### 6.1 Deployment
- [ ] Containerize application (Docker)
- [ ] Set up CI/CD pipeline
- [ ] Deploy to staging environment
- [ ] Run smoke tests

#### 6.2 A/B Testing
- [ ] Deploy alongside `ai/` (port 3002)
- [ ] Route 10% traffic to `ai-langx/`
- [ ] Monitor metrics (latency, errors, cost)
- [ ] Compare with custom implementation

#### 6.3 Cutover
- [ ] Gradually increase traffic to 100%
- [ ] Monitor LangSmith dashboard
- [ ] Address any issues
- [ ] Deprecate `ai/` folder

**Deliverable**: Full migration complete

---

## 12. Success Metrics

### 12.1 Development Metrics

| Metric | Target |
|--------|--------|
| **Time to Implement** | 5-6 weeks (vs 8 weeks custom) |
| **Lines of Code** | ~500-800 (vs 2000 custom) |
| **Test Coverage** | >80% |
| **Documentation** | Complete (all modules documented) |

### 12.2 Performance Metrics

| Metric | Target |
|--------|--------|
| **Latency (p95)** | <3s for tool-calling, <5s for RAG |
| **Error Rate** | <1% |
| **Availability** | >99.5% |
| **Token Usage** | Same as custom (no increase) |

### 12.3 Operational Metrics

| Metric | Target |
|--------|--------|
| **Mean Time to Debug** | <10 min (vs 30 min custom) |
| **Deployment Frequency** | Daily (vs weekly) |
| **Rollback Time** | <5 min |
| **Onboarding Time** | 1 day (vs 5 days custom) |

---

## 13. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Framework breaking changes** | Medium | High | Pin LangChain version, test before upgrading |
| **LangSmith outage** | Low | Low | Tracing is optional, app continues working |
| **Performance regression** | Low | Medium | A/B test, monitor latency |
| **Learning curve** | Medium | Low | Start small, train team, document patterns |
| **Over-engineering** | Medium | Medium | Keep it simple, use frameworks for real needs |

---

## 14. Conclusion

### 14.1 Architecture Summary

This architecture provides:
- ✅ **Production-grade**: LangSmith observability, error handling, testing
- ✅ **Maintainable**: Standard patterns, clear separation of concerns
- ✅ **Performant**: Parallel execution, caching, efficient RAG
- ✅ **Flexible**: Easy to add features, swap components
- ✅ **Auditable**: Deterministic financial logic, full traceability

### 14.2 Why This Design Works

1. **Hybrid Approach**: Framework orchestration + deterministic logic
2. **Right Tool for Right Job**: LangGraph for workflows, AgentExecutor for tool-calling
3. **Production-First**: Observability and reliability built-in
4. **Maintainability**: Standard patterns, less custom code
5. **Backward Compatible**: Same APIs, drop-in replacement

### 14.3 Next Steps

1. **Review this architecture plan**
2. **Approve folder structure and module design**
3. **Start Phase 1: Foundation** (Week 1)
4. **Iterative development with testing**
5. **Deploy and monitor**

---

**End of Architecture Plan**
