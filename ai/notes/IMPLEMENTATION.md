# Implementation Guide & Features

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Intent Routing](#intent-routing)
3. [MCP Tool System](#mcp-tool-system)
4. [Agent Loop](#agent-loop)
5. [RAG Pipeline](#rag-pipeline)
   - [PDF Extraction](#stage-1-pdf-extraction)
   - [Chunking](#stage-2-chunking)
   - [Embeddings](#stage-3-embeddings)
   - [Vector Store](#stage-4-vector-store)
   - [Similarity Search](#stage-5-similarity-search)
   - [Context Augmentation](#stage-6-context-augmentation)
   - [LLM Generation](#stage-7-llm-generation)
6. [Comparison Engine](#comparison-engine)
7. [Reconciliation Pipeline](#reconciliation-pipeline)
8. [Production Hardening](#production-hardening)
9. [Two-Step Confirmation](#two-step-confirmation)
10. [AI Concepts Reference](#ai-concepts-reference)

---

## Feature Overview

### 1. Natural Language Expense Management (TRANSACTIONAL)

Users interact with expenses using conversational language:
- Add, modify, delete, and list expenses
- Intelligent category mapping
- Date parsing (today, yesterday, last Friday, etc.)
- Multi-expense processing in single request

**Examples:**
```
"Add 1500 for groceries yesterday"  --> Creates expense via MCP tool
"Show all my transport expenses this month"  --> Lists with filters
"Delete expense 123"  --> Removes single expense
"Update my last expense to 600"  --> Modifies existing
"Clear all expenses from January"  --> Bulk delete with confirmation
```

### 2. Document Intelligence (RAG_QA)

Upload PDF expense statements and ask questions:
- Bank statements, credit card bills, receipts
- Semantic search with source citations
- Extract and analyze expense data from PDFs

**Examples:**
```
"What did I spend on restaurants in my credit card statement?"
--> "According to your uploaded statement, you spent 3,450 on
     restaurants: 1,200 at Cafe Coffee Day [Source 1], 1,500 at
     Domino's Pizza [Source 3], and 750 at Subway [Source 5]."
```

### 3. Smart Comparison (RAG_COMPARE)

Compare PDF expenses with app-tracked expenses:
- Code-based diff computation (not LLM-generated)
- Identify discrepancies and missing entries
- Match confidence scoring

**Examples:**
```
"Compare my bank statement with my tracked expenses"
--> "I found 18 matched expenses, but there are 3 discrepancies:
     - 850 ATM withdrawal on Jan 28 is in your statement but not tracked
     - 200 coffee expense on Jan 29 is tracked but not in statement
     Overall match rate: 85.7%."
```

### 4. Bi-Directional Reconciliation (SYNC_RECONCILE)

Sync expenses between PDF documents and the app:
- 6-stage pipeline (compare, plan, validate, sync, report, respond)
- Deterministic logic (zero LLM decisions on money)
- Downloadable CSV + HTML audit reports
- Idempotent and partial-failure safe

### 5. Help & Guidance (CLARIFICATION)

Context-aware help system:
- System capability explanations
- Friendly onboarding
- Educational responses about reconciliation

---

## Intent Routing

**File**: `src/router/intentRouter.js`

### Classification Logic

```
classifyIntent(userMessage)
    |
    +--> LLM Classification (primary)
    |    +-- Few-shot prompt with examples
    |    +-- Temperature: 0.1 (near-deterministic)
    |
    +--> Rule-based Fallback (on LLM error)
         +-- Keyword matching:
             "sync"    --> SYNC_RECONCILE
             "compare" --> RAG_COMPARE
             "pdf"     --> RAG_QA
             default   --> TRANSACTIONAL
```

### 5 Intent Types

| Intent | When Triggered | Handler |
|--------|---------------|---------|
| `TRANSACTIONAL` | Expense CRUD operations | transactionalHandler.js |
| `RAG_QA` | Questions about uploaded PDFs | ragQaHandler.js |
| `RAG_COMPARE` | PDF vs App comparison | ragCompareHandler.js |
| `SYNC_RECONCILE` | Bi-directional sync requests | syncReconcileHandler.js |
| `CLARIFICATION` | Help, greetings, out-of-scope | clarificationHandler.js |

### Handler Delegation

**File**: `src/routes/chat.js`

```javascript
switch (intent) {
  case 'TRANSACTIONAL':
    reply = await handleTransactional(message, token, history, context);
    break;
  case 'RAG_QA':
    reply = await handleRagQA(message, token, userId);
    break;
  case 'RAG_COMPARE':
    reply = await handleRagCompare(message, token, userId);
    break;
  case 'SYNC_RECONCILE':
    reply = await handleSyncReconcile(message, token, userId);
    break;
  case 'CLARIFICATION':
    reply = await handleClarification(message);
    break;
}
```

Context propagation includes `traceId` for request correlation and `userId` from JWT token.

---

## MCP Tool System

**Files**: `src/mcp/tool.interface.js`, `src/mcp/tools/`

### Tool Definition Structure

Each tool follows a consistent interface:

```javascript
{
  definition: {
    type: "function",
    function: {
      name: "create_expense",
      description: "Adds a new expense to the tracker...",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "..." },
          category: { type: "string", description: "..." },
          description: { type: "string", description: "..." },
          expense_date: { type: "string", description: "..." }
        },
        required: ["amount", "category"]
      }
    }
  },
  run: async (args, token) => {
    // Validation
    // Normalization
    // Backend API call via backendClient
    // Error handling
  }
}
```

Definitions are passed directly to OpenAI's `tools` parameter for function calling.

### 5 MCP Tools

| Tool | Backend Endpoint | Method | Purpose |
|------|------------------|--------|---------|
| `create_expense` | POST /api/expenses | HTTP | Add new expense |
| `list_expenses` | GET /api/expenses | HTTP | Retrieve with filters |
| `modify_expense` | PUT /api/expenses/:id | HTTP | Update existing |
| `delete_expense` | DELETE /api/expenses/:id | HTTP | Remove single |
| `clear_expenses` | DELETE /api/expenses | HTTP | Bulk delete |

### Key Principle

AI never directly accesses the database. All operations flow through: `LLM --> MCP Tool --> Backend Client (Axios) --> Backend API --> Database`.

The backend client (`src/utils/backendClient.js`) creates an Axios instance with the JWT forwarded:

```javascript
const createClient = (token) => {
  return axios.create({
    baseURL: config.backendBaseUrl,  // from src/config/env.js
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};
```

---

## Agent Loop

**File**: `src/llm/agent.js`

### Tool Calling Loop

The agent implements a manual ReAct (Reason, Act, Observe) loop:

```javascript
async function processChatMessage(userMessage, authToken, history, context) {
  const messages = [
    { role: "system", content: getSystemPrompt() },
    ...history,
    { role: "user", content: userMessage }
  ];

  let toolIterationCount = 0;
  const MAX_ITERATIONS = 5;

  // Initial LLM call
  let response = await callLLMWithTimeout(messages);
  let responseMessage = response.choices[0].message;

  // Tool execution loop
  while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    toolIterationCount++;

    if (toolIterationCount > MAX_ITERATIONS) {
      return "I apologize, but I'm having trouble completing your request. "
           + "It requires too many operations. Please try breaking it into smaller requests.";
    }

    // Add assistant's tool request to conversation
    messages.push(responseMessage);

    // Execute all tool calls
    for (const toolCall of responseMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Execute tool with safety wrappers
      const result = await executeTool(toolName, toolArgs, authToken, context);

      // Add tool result to conversation
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    // Call LLM again with tool results
    response = await callLLMWithTimeout(messages);
    responseMessage = response.choices[0].message;
  }

  // Return final response
  return responseMessage.content;
}
```

### Safety Features

- **Iteration limit**: Max 5 tool call cycles per request (prevents infinite loops)
- **LLM timeout**: 60 seconds per LLM call
- **Tool timeout**: 30 seconds per tool execution
- **Error classification**: Distinguishes validation vs system errors
- **Token usage tracking**: Monitors costs per request
- **Structured logging**: Trace IDs for debugging

---

## RAG Pipeline

The RAG pipeline has 7 stages: extract, chunk, embed, store, search, augment, generate.

### Stage 1: PDF Extraction

**File**: `src/utils/pdfExtractor.js`

- Library: `pdf-parse`
- Multi-tier fallback for corrupt PDFs (handles "bad XRef entry" errors)
- Page-by-page extraction with page number preservation
- Text cleaning (remove control chars, normalize whitespace)
- 30-second timeout per PDF
- 10MB file size limit

### Stage 2: Chunking

**File**: `src/rag/chunker.js`

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 1500 characters (~375 tokens) | Sweet spot of 300-500 tokens |
| Overlap | 200 characters (~50 tokens) | 13% overlap preserves context |

**Why these numbers?**
- **Too small** (<200 chars): Loses context, low retrieval accuracy
- **Too large** (>2000 chars): Embeds mixed topics, noisy retrieval
- **Sweet spot**: 300-500 tokens (our 375 is ideal)

**Overlap prevents information loss at boundaries:**
- Without overlap: "The hotel cost" | "$500" (no context!)
- With overlap: "The hotel cost $500" | "...cost $500. Next day..."

**Features:**
- Smart sentence boundary detection
- Paragraph-aware chunking
- Infinite loop prevention (safety guard: MAX_CHUNKS=10000)
- Page metadata preserved per chunk

**Critical Bug Fix**: Fixed infinite loop where overlap >= chunkSize could cause backward movement of the start index.

### Stage 3: Embeddings

**File**: `src/rag/embeddings.js`

- Model: `text-embedding-ada-002` (1536 dimensions)
- Context window: 8191 tokens
- Cost: ~$0.0001 per 1K tokens
- Latency: ~50-200ms per call
- Batch processing: 100 chunks per API call
- Rate limiting: 200ms delay between batches
- Retry logic for rate limit errors
- Fallback: zero vector on failure (better than crash)

**What are embeddings?** Text-to-vector transformation learned from a massive corpus. Similar meanings produce similar vectors:
- "hotel expense" --> [0.023, -0.089, 0.044, ...]
- "accommodation cost" --> [0.021, -0.091, 0.046, ...]
- Cosine similarity: 0.87 (very similar)

### Stage 4: Vector Store

**File**: `src/rag/vectorStore.js`

**Data Structure:**
```javascript
{
  documents: [
    {
      id: "doc_1738512000_abc123",
      filename: "statement.pdf",
      chunks: [
        {
          index: 0,
          text: "Transaction history for January...",
          embedding: [0.023, -0.089, ...],  // 1536 dims
          pageNumber: 1,
          startChar: 0,
          endChar: 1500
        }
      ],
      metadata: {
        userId: 1,       // For user isolation
        storedAt: "2026-02-02T10:30:00Z",
        pageCount: 3
      }
    }
  ]
}
```

**User Isolation** (critical for multi-tenancy):
```javascript
getAllChunks(userId) {
  return vectorStore.documents
    .filter(doc => doc.metadata.userId === userId)
    .flatMap(doc => doc.chunks);
}
```

**Expense Extraction from PDFs:** Uses regex pattern matching (NOT LLM) to extract structured expense data from unstructured text. Supports multiple formats:
- Electricity bills: `09-12-2025  1,255.00  73.00`
- Expense tables: `Feb 1, 2026  Clothes  Shopping  $300.00`
- Currency formats: `450 for lunch`

**Why regex instead of LLM?** Deterministic (same input = same output), fast (no API calls), free ($0), reliable (no hallucinations).

### Stage 5: Similarity Search

**File**: `src/rag/search.js`

**Algorithm**: Cosine Similarity

```
cos(theta) = (A . B) / (||A|| * ||B||)

Where:
  A . B = dot product = sum(A[i] * B[i])
  ||A|| = magnitude = sqrt(sum(A[i]^2))

Range: -1 to 1 (1 = identical, 0 = orthogonal, -1 = opposite)
```

**Process:**
1. Convert query to embedding (1536-dim vector)
2. Filter chunks by userId
3. Compute cosine similarity with all user chunks
4. Filter by threshold (>= 0.3)
5. Sort descending by similarity
6. Return top-K (default: 5)

**Threshold Guidance:**
- 0.9-1.0: Near-exact matches (strict)
- 0.7-0.9: Highly similar (typical)
- 0.5-0.7: Somewhat similar
- 0.3-0.5: Loosely related (our default min)
- <0.3: Likely irrelevant

**Hybrid Search** (semantic + keyword):
```
score = (0.7 * semantic_score) + (0.3 * keyword_score)
```
Semantic search is good for concepts but bad for exact matches. Keyword search handles exact terms like order numbers. Hybrid combines both strengths.

### Stage 6: Context Augmentation

**File**: `src/handlers/ragQaHandler.js`

```javascript
const contextText = relevantChunks
  .map((chunk, idx) => `[Source ${idx + 1}]: ${chunk.text}`)
  .join('\n\n');

const augmentedPrompt = `
You are an AI assistant helping analyze expense documents.

CONTEXT FROM UPLOADED DOCUMENTS:
${contextText}

USER QUESTION:
${userMessage}

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain the answer, say "I don't have that information"
- Cite source numbers when possible
`;
```

**Why this structure?**
- System prompt grounds LLM behavior
- Source attribution enables citation
- Context first primes LLM before question
- Explicit boundaries: "ONLY on provided context"
- Reduces hallucination risk

### Stage 7: LLM Generation

**Parameters:**
```javascript
{
  model: "gpt-4o-mini",
  temperature: 0.3,  // Factual, low creativity
  max_tokens: 500,   // Prevent rambling
}
```

**Temperature guide:**
- 0.0: Deterministic, always picks most likely token
- 0.1: Used for intent classification
- 0.3: Used for RAG Q&A (factual)
- 0.7: Used for general generation (balanced)
- 1.0+: Creative but potentially incoherent

---

## Comparison Engine

**File**: `src/comparison/expenseComparator.js`

Pure JavaScript comparison with zero LLM involvement.

### Algorithm

1. **Normalization**
   - Dates --> YYYY-MM-DD
   - Amounts --> Float (2 decimal places)
   - Descriptions --> Lowercase, trimmed

2. **Matching Logic**
   ```javascript
   matchExpenses(pdfExpenses, appExpenses, {
     amountTolerance: 0.01,        // +/- 0.01
     requireSameDate: true,
     minDescriptionSimilarity: 0.5  // Jaccard threshold
   })
   ```

3. **Description Similarity** (Jaccard on word tokens):
   ```
   Jaccard(A, B) = |A intersect B| / |A union B|

   "Coffee Shop Downtown" vs "Coffee Shop"
   A = {coffee, shop, downtown}, B = {coffee, shop}
   Intersection = {coffee, shop} = 2
   Union = {coffee, shop, downtown} = 3
   Jaccard = 2/3 = 0.67 (similar enough)
   ```

4. **Classification**
   - **Matched**: Found in both PDF and app
   - **PDF Only**: In PDF but missing from app
   - **App Only**: In app but not in PDF

5. **Output**: Structured diff object with summary statistics and match confidence scores.

**Key**: LLM only explains results. It does NOT compute the diff.

---

## Reconciliation Pipeline

**Files**: `src/reconcile/reconciliationPlanner.js`, `src/reconcile/syncHandler.js`, `src/reports/pdfGenerator.js`, `src/handlers/syncReconcileHandler.js`

### Reconciliation Rules

```javascript
const RECONCILIATION_RULES = {
  MIN_AMOUNT_THRESHOLD: 1.0,           // Minimum to sync
  MAX_AUTO_SYNC_AMOUNT: 10000.0,       // Max without approval
  ALLOW_UNDATED_EXPENSES: true,        // Sync without dates?
  ALLOW_DUPLICATE_DESCRIPTIONS: false, // Sync duplicates?
  DEFAULT_CATEGORY: 'Other'            // Fallback category
};
```

### Why NO LLM in Reconciliation

- **Compliance**: Financial decisions require 100% determinism
- **Audit Trail**: Code-based logic is traceable and version-controlled
- **Regulations**: Many jurisdictions forbid "AI decisions" on money
- **Trust**: Users need guarantees, not probabilities
- **Reproducibility**: Same inputs must always produce same outputs

### Critical Bug Fixes Applied

1. **Date Normalizer** (`src/utils/dateNormalizer.js`): Converts all formats ("Feb 3, 2026", "DD/MM/YYYY", "today", "yesterday") to YYYY-MM-DD. Prevents 90% of sync failures.

2. **Deduplication** (in `syncHandler.js`): Stable key `date|amount|category|description`. Applied BEFORE execution.

3. **Pre-Validation**: Validates dates before backend call. Skips invalid data (does not hit backend). Separates validation errors from backend errors.

4. **Execution Tracking**: Three states -- succeeded, failed (retryable), skipped (validation error). Enables targeted retry logic.

5. **Summary Counters**: Fixed "undefined expenses" bug. Uses correct fields: `approvedForApp`, `approvedForPdf`, `totalMatched` with null-safe defaults.

### Report Generation

**File**: `src/reports/pdfGenerator.js`

- **CSV**: Machine-readable, Excel-compatible
- **HTML**: Browser-printable with "Save as PDF" option
- **Storage**: `ai/data/reports/expense_report_{userId}_{timestamp}.{csv|html}`
- **Labels**: "SYNCED" badge for clear visual distinction
- **NO AI involvement**: Financial documents must be deterministic and reproducible

---

## Production Hardening

### Before vs After

| Aspect | Before (Demo) | After (Production) |
|--------|---------------|-------------------|
| Logging | console.log (no correlation) | Structured JSON logs with trace IDs |
| Timeouts | None (hanging requests possible) | 30s per tool, 60s per LLM call |
| Retries | Retry all errors blindly | Smart retry (only transient errors) |
| Duplicates | No detection (retry = duplicate) | Idempotency with 24h cache |
| Costs | No visibility (surprise bills) | Token tracking + tier budgets |
| Privacy | All users see all PDFs | User isolation enforced |
| Loops | No protection | Max 5 tool iterations |

### Production Components

| Component | File | Purpose |
|-----------|------|---------|
| Structured Logging | `utils/logger.js` | Trace IDs, JSON logs, log levels |
| Error Classification | `utils/errorClassification.js` | Smart retry decisions (40% fewer wasted calls) |
| Retry Logic | `utils/retry.js` | Exponential backoff + jitter |
| Tool Executor | `utils/toolExecutor.js` | Timeouts, validation, safety wrappers |
| Idempotency | `utils/idempotency.js` | Duplicate prevention (24h TTL cache) |
| Cost Tracking | `utils/costTracking.js` | Token budgets, per-user usage analytics |

### Tool Execution Safety Stack

Every tool call flows through multiple safety layers:

```
User Request
    |
[Layer 1] Input Validation
    +-- Length limits (max 10,000 chars)
    +-- Type and format validation
    +-- Sanitization
    |
[Layer 2] Intent Classification
    +-- LLM classification (temp=0.1)
    +-- Whitelist validation
    +-- Context propagation (traceId, userId)
    |
[Layer 3] Tool Argument Validation
    +-- Schema validation
    +-- Required field checks
    +-- Type enforcement
    |
[Layer 4] Idempotency Check
    +-- Generate key: hash(userId + tool + args)
    +-- Check cache (24h TTL)
    +-- Return cached if duplicate
    |
[Layer 5] Tool Execution (with safety)
    +-- 30 second timeout
    +-- Retry on transient failures (max 2x)
    +-- Error classification
    +-- Full audit logging
    |
[Layer 6] Result Caching
    +-- Store in idempotency cache
    +-- 24 hour retention
    |
[Layer 7] Cost Tracking
    +-- Record token usage
    +-- Check budget limits
    +-- Alert if approaching cap
    |
Success Response
```

### Error Classification

```javascript
const classification = classifyError(error);

if (classification.category === 'ValidationError') {
  throw error;  // Fail fast, don't retry
}

if (classification.category === 'TransientError') {
  // Retry with exponential backoff + jitter
  const delay = 1000 * Math.pow(2, attempt) + jitter;
  await sleep(delay);
  return retry(fn);
}
```

### Cost Control

**Token budgets per tier:**
- Free: 50K tokens/month (~200 requests)
- Basic: 200K tokens/month (~800 requests)
- Pro: 1M tokens/month (~4000 requests)
- Enterprise: Unlimited

**Estimated costs** (100-user system, gpt-4o-mini):
- Embeddings: 500K tokens/month * $0.0001 = $0.05/month
- LLM Calls: 5M tokens/month * $0.0006 = $3.00/month
- Total: ~$3.05/month

**Cost safeguards:**
- Max 5 tool iterations (prevents infinite loops)
- Token budgets per user tier (prevents abuse)
- 500 token max response (prevents verbosity)
- Smart retry (only transient errors, not validation)
- Idempotency (no duplicate operations)

### Structured Logging

Example log flow with trace ID correlation:

```json
{"timestamp":"...","level":"INFO","context":"chat-route",
 "traceId":"tr_1707310800_a3f9d2","userId":42,
 "message":"Processing chat message"}

{"timestamp":"...","level":"INFO","context":"intent-router",
 "traceId":"tr_1707310800_a3f9d2","userId":42,
 "message":"Intent classified","intent":"TRANSACTIONAL"}

{"timestamp":"...","level":"INFO","context":"tool-executor",
 "traceId":"tr_1707310800_a3f9d2","userId":42,
 "message":"Executing tool: create_expense"}

{"timestamp":"...","level":"INFO","context":"cost-tracker",
 "traceId":"tr_1707310800_a3f9d2","userId":42,
 "message":"Recorded token usage","totalTokens":1250,"cost":"0.000750"}
```

---

## Two-Step Confirmation

Destructive operations (delete, clear) require explicit user confirmation to prevent accidental data loss.

**Safety guardrails:**
1. Never auto-delete -- require confirmation step
2. Ask clarifying questions when data is ambiguous ("Which date?", "Which category?")
3. No assumptions -- if amount/date/category is missing, ask
4. Tool-only execution -- LLM cannot invent API calls
5. Audit logs -- log user input, tool calls, results

---

## AI Concepts Reference

### Deterministic vs Probabilistic Logic

| Type | Used For | Guarantee |
|------|----------|-----------|
| **Probabilistic** | Intent classification, RAG generation | Different runs may produce slightly different wording |
| **Deterministic** | Reconciliation planner, MCP tools, date normalization | Same inputs ALWAYS produce same outputs |

**Best Practice**: Use LLMs for understanding/generation, code for decisions.

### Planning vs Execution Separation

**Files**: `reconciliationPlanner.js` (planning) vs `syncHandler.js` (execution)

**Why separate?**
- Can review plan before execution (dry run mode)
- Can retry execution without re-planning
- Clear checkpoint for testing
- Enables "plan preview" feature

### Embeddings and Vector Similarity

**Cosine Similarity** (our implementation):
```
cos(theta) = A . B / (||A|| * ||B||)
Range: -1 to 1 (1 = identical, 0 = orthogonal)
Best for: Text, where direction matters more than magnitude
```

**Other metrics** (not implemented):
- **Dot Product**: Range -inf to +inf. Best when magnitude matters. Faster (no normalization).
- **Euclidean Distance**: Range 0 to +inf. Best for spatial data, not text.

**Industry Standard**: Cosine similarity for text embeddings.

### Hallucination Prevention

- Explicit instruction: "If answer not in context, say so"
- Source labeling: Forces LLM to reference sources
- Low temperature: Reduces creative fabrication
- Context boundaries: "Answer ONLY from provided context"
- Code-based computation for financial operations

### Scalability Thresholds

| Metric | Current (In-Memory) | Need Vector DB | Need Distributed |
|--------|--------------------|-----------------|--------------------|
| Users | 1-1,000 | 1K-50K | 50K+ |
| Documents | 1-10,000 | 10K-500K | 500K+ |
| Queries/sec | 1-50 | 50-500 | 500+ |
| RAM usage | <4GB | 4-32GB | 32GB+ |
