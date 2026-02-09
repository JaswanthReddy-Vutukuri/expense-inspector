# Part 7: Integration & Production
## Complete System, Best Practices & Deployment

**Prerequisites**: Complete Parts 1-6  
**Concepts Covered**: 30+  
**Reading Time**: 4-5 hours  
**Outcome**: Production-ready AI system

---

## Table of Contents

43. [Framework Integration](#chapter-43-framework-integration)
44. [ai-langx/ Complete Walkthrough](#chapter-44-ai-langx-complete-walkthrough)
45. [Production Best Practices](#chapter-45-production-best-practices)
46. [Error Handling & Recovery](#chapter-46-error-handling--recovery)
47. [Performance Optimization](#chapter-47-performance-optimization)
48. [Security & Authentication](#chapter-48-security--authentication)
49. [Deployment Strategies](#chapter-49-deployment-strategies)
50. [Troubleshooting Guide](#chapter-50-troubleshooting-guide)

---

## Chapter 43: Framework Integration

### 43.1 LangChain + LangGraph + LangSmith Together

**How they integrate**:

```
User Request
     ↓
┌─────────────────────────────────────────┐
│  Express API Server (Backend)            │
│                                         │
│  ┌───────────────────────────────┐     │
│  │ LangGraph (Orchestration)     │     │
│  │ - Intent classification       │     │
│  │ - Conditional routing         │     │
│  │ - State management            │     │
│  └───────────┬───────────────────┘     │
│              ↓                          │
│  ┌───────────────────────────────┐     │
│  │ LangChain (Execution)         │     │
│  │ - Agents (tool calling)       │     │
│  │ - RAG (retrieval + QA)        │     │
│  │ - Chains (structured flows)   │     │
│  └───────────┬───────────────────┘     │
│              ↓                          │
│  ┌───────────────────────────────┐     │
│  │ LLMs & Tools                  │     │
│  │ - ChatOpenAI (GPT-4o-mini)    │     │
│  │ - CreateExpenseTool           │     │
│  │ - VectorStore (embeddings)    │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  LangSmith (Observability)              │
│  - Traces (execution tree)              │
│  - Costs & Latency                      │
│  - Errors & Debugging                   │
│  - User Feedback                        │
└─────────────────────────────────────────┘
```

### 43.2 Request Flow Diagram

```
1. User: "Add 500 for lunch"
        ↓
2. Frontend → POST /ai/chat { message: "Add 500 for lunch" }
        ↓
3. Express Middleware:
   - Authentication (JWT validation)
   - Rate limiting (20 req/min per user)
   - CORS headers
        ↓
4. LangGraph - Intent Router:
   - classifyIntent node (LLM call)
   - Intent: "transactional", Confidence: 0.95
   - Router: High confidence → transactionalHandler
        ↓
5. LangChain - Agent Executor:
   - LLM Plans: "Need to call CreateExpenseTool"
   - Tool Execution: CreateExpenseTool({ amount: 500, category: "Food", ... })
   - API Call: POST /api/expenses (backend)
   - Tool Result: { success: true, expenseId: 123 }
   - LLM Final Answer: "✅ Expense created: Lunch - ₹500"
        ↓
6. LangSmith (automatic):
   - Trace captured with full execution tree
   - Tags: ["production", "transactional", "user-456"]
   - Cost: $0.0045, Latency: 1.2s
        ↓
7. Response: { answer: "✅ Expense created...", runId: "..." }
        ↓
8. Frontend: Display answer + feedback buttons (👍 👎)
```

### 43.3 Technology Stack

```
┌──────────────────────────────────────────────────┐
│ Frontend (Angular)                               │
│ - TypeScript                                     │
│ - RxJS (observables for streaming)              │
│ - HTTP Client (API calls)                       │
└────────────────┬─────────────────────────────────┘
                 ↓ HTTP/REST
┌──────────────────────────────────────────────────┐
│ Backend API (Express.js)                         │
│ - Node.js 18+                                    │
│ - Express (routing)                              │
│ - Middleware (auth, rate limiting, CORS)        │
└────────────────┬─────────────────────────────────┘
                 ↓ Function Calls
┌──────────────────────────────────────────────────┐
│ AI Layer (LangChain + LangGraph)                 │
│ - @langchain/langgraph (workflows)               │
│ - @langchain/core (abstractions)                 │
│ - @langchain/openai (LLMs & embeddings)          │
└────────────────┬─────────────────────────────────┘
                 ↓ API Calls
┌──────────────────────────────────────────────────┐
│ External Services                                │
│ - OpenAI API (GPT-4o-mini, embeddings)           │
│ - LangSmith API (tracing)                        │
│ - Backend REST API (CRUD operations)             │
└──────────────────────────────────────────────────┘
```

### 43.4 Folder Structure Integration

```
ai-langx/
├── server.js  ← Express app entry point
├── src/
│   ├── graphs/  ← LangGraph workflows
│   │   └── intentRouter.graph.js  (StateGraph)
│   ├── handlers/  ← LangChain chains/agents
│   │   ├── transactionalHandler.js  (AgentExecutor)
│   │   ├── ragQaHandler.js  (RetrievalQAChain)
│   │   ├── syncReconcileHandler.js  (custom)
│   │   └── clarificationHandler.js  (simple LLM)
│   ├── agents/  ← Agent configurations
│   │   └── expense.agent.js  (tools + LLM)
│   ├── tools/  ← LangChain tools
│   │   ├── createExpense.tool.js  (StructuredTool)
│   │   ├── listExpenses.tool.js
│   │   └── deleteExpense.tool.js
│   ├── rag/  ← RAG components
│   │   ├── embeddings.js  (OpenAIEmbeddings)
│   │   ├── vectorStore.js  (MemoryVectorStore)
│   │   ├── retriever.js  (asRetriever)
│   │   └── chunker.js  (RecursiveCharacterTextSplitter)
│   ├── config/  ← Configuration
│   │   ├── langsmith.config.js  (tags, metadata)
│   │   └── llm.config.js  (model settings)
│   ├── routes/  ← API endpoints
│   │   ├── chat.js  (POST /ai/chat)
│   │   └── feedback.js  (POST /ai/feedback)
│   ├── middleware/  ← Express middleware
│   │   ├── auth.js  (JWT validation)
│   │   └── errorHandler.js  (catch errors)
│   └── utils/  ← Utilities
│       ├── backendClient.js  (axios instance)
│       └── errorClassification.js
└── data/
    └── vectorstore/  ← Persisted embeddings
```

### 43.5 Dependency Management

```json
// package.json

{
  "name": "ai-langx",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    // Core frameworks
    "@langchain/langgraph": "^0.0.34",
    "@langchain/core": "^0.2.0",
    "@langchain/openai": "^0.0.28",
    
    // LangSmith
    "langsmith": "^0.1.0",
    
    // Vector stores & embeddings
    "faiss-node": "^0.5.1",  // Optional: FAISS for large scale
    
    // Express API
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.10.0",
    
    // Utilities
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "zod": "^3.22.0"  // Schema validation
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 43.6 Environment Configuration

```bash
# .env

# OpenAI
OPENAI_API_KEY=sk-...

# LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=ai-langx-prod
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com

# Backend API
BACKEND_API_URL=http://localhost:3000
BACKEND_API_TIMEOUT=30000

# Server
PORT=3001
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=20  # 20 per minute per user

# Caching
ENABLE_LLM_CACHE=true
CACHE_TTL_SECONDS=3600  # 1 hour
```

### 43.7 Real Example: Complete Chat Endpoint

```javascript
// File: src/routes/chat.js

import express from 'express';
import { intentRouterGraph } from '../graphs/intentRouter.graph.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /ai/chat
router.post('/',
  authMiddleware,  // Validate JWT
  rateLimitMiddleware,  // Rate limit
  async (req, res, next) => {
    const { message } = req.body;
    const userId = req.user.id;  // From JWT
    const authToken = req.headers.authorization;
    
    try {
      // Invoke LangGraph workflow
      const result = await intentRouterGraph.invoke(
        { userMessage: message },
        {
          configurable: {
            userId,
            authToken,
            thread_id: `user-${userId}-${Date.now()}`
          },
          tags: ["production", `user-${userId}`],
          metadata: {
            userId,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent']
          },
          recursionLimit: 25
        }
      );
      
      // Response
      res.json({
        answer: result.finalResponse,
        sources: result.sources || [],
        intent: result.intent,
        confidence: result.intentConfidence,
        runId: result.runId  // For feedback
      });
      
    } catch (error) {
      next(error);  // Pass to error handler
    }
  }
);

export default router;
```

**✅ You now understand Framework Integration!**

---

## Chapter 44: ai-langx/ Complete Walkthrough

### 44.1 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Angular)                     │
│  - Chat UI                                                │
│  - Expense management                                     │
│  - Feedback buttons                                       │
└────────────────┬─────────────────────────────────────────┘
                 ↓ HTTP POST /ai/chat
┌──────────────────────────────────────────────────────────┐
│              AI Backend (ai-langx/)                       │
│                                                           │
│  [Express Middleware]                                     │
│  - Auth: Validate JWT token                              │
│  - Rate Limit: 20 requests/min per user                  │
│  - Error Handler: Catch and classify errors              │
│                                                           │
│  [LangGraph: Intent Router]                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. classifyIntent (GPT-4o-mini)                 │    │
│  │    Input: userMessage                           │    │
│  │    Output: intent, confidence                   │    │
│  │                                                  │    │
│  │ 2. Route by intent + confidence:                │    │
│  │    - transactional → transactionalHandler       │    │
│  │    - qa → ragQaHandler                          │    │
│  │    - reconciliation → syncReconcileHandler      │    │
│  │    - clarification → clarificationHandler       │    │
│  │    - Low confidence → clarificationHandler      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  [LangChain Handlers]                                     │
│                                                           │
│  ┌─ transactionalHandler ───────────────────────┐       │
│  │ AgentExecutor (ReAct pattern)                │       │
│  │ Tools:                                       │       │
│  │  - CreateExpenseTool (POST /api/expenses)    │       │
│  │  - ListExpensesTool (GET /api/expenses)      │       │
│  │  - DeleteExpenseTool (DELETE /api/expenses)  │       │
│  │ LLM: gpt-4o-mini (tool calling)              │       │
│  └──────────────────────────────────────────────┘       │
│                                                           │
│  ┌─ ragQaHandler ──────────────────────────────┐        │
│  │ RAG Pipeline:                                │        │
│  │ 1. Embed query (OpenAIEmbeddings)            │        │
│  │ 2. Search vector store (top 4 docs)          │        │
│  │ 3. LLM answer (gpt-4o-mini + context)        │        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
│  ┌─ syncReconcileHandler ─────────────────────┐         │
│  │ Custom logic:                               │         │
│  │ 1. Fetch user expenses                      │         │
│  │ 2. Fetch company report                     │         │
│  │ 3. Compare & find discrepancies             │         │
│  │ 4. Generate report (CSV/HTML)               │         │
│  └──────────────────────────────────────────────┘         │
│                                                           │
│  ┌─ clarificationHandler ─────────────────────┐          │
│  │ Simple LLM call (gpt-4o-mini)               │          │
│  │ Ask user to rephrase or provide guidance   │          │
│  └──────────────────────────────────────────────┘          │
└───────────────────────────────────────────────────────────┘
                 ↓ All traced automatically
┌──────────────────────────────────────────────────────────┐
│                  LangSmith Dashboard                      │
│  - Full trace tree                                        │
│  - Cost: $0.0045                                          │
│  - Latency: 1.2s                                          │
│  - Tags: ["production", "transactional", "user-456"]      │
└──────────────────────────────────────────────────────────┘
```

### 44.2 Entry Point (server.js)

```javascript
// File: server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './src/routes/chat.js';
import feedbackRoutes from './src/routes/feedback.js';
import { errorHandlerMiddleware } from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/ai/chat', chatRoutes);
app.use('/ai/feedback', feedbackRoutes);

// Error handler (must be last)
app.use(errorHandlerMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`✅ AI Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`LangSmith Tracing: ${process.env.LANGCHAIN_TRACING_V2 === 'true' ? 'Enabled' : 'Disabled'}`);
});
```

### 44.3 Step-by-Step: Create Expense Request

**User Action**: Types "Add 500 for lunch" in chat

#### **Step 1: Frontend Sends Request**

```typescript
// Frontend: src/app/services/ai.service.ts

sendMessage(message: string): Observable<ChatResponse> {
  return this.http.post<ChatResponse>('/ai/chat', {
    message
  }, {
    headers: {
      'Authorization': `Bearer ${this.authService.getToken()}`
    }
  });
}
```

#### **Step 2: Express Middleware**

```javascript
// Auth middleware validates JWT
authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { id: decoded.userId, email: decoded.email };
  next();
}

// Rate limit: 20 requests/min per user
rateLimitMiddleware = rateLimit({
  windowMs: 60000,
  max: 20,
  keyGenerator: (req) => req.user.id
});
```

#### **Step 3: Intent Classification (LangGraph Node)**

```javascript
// File: src/graphs/nodes/classifyIntent.node.js

export const classifyIntentNode = async (state, config) => {
  const { userMessage } = state;
  
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    tags: getTraceTags("classification", config.configurable.userId),
    metadata: getTraceMetadata(config.configurable.traceId, config.configurable.userId)
  });
  
  const prompt = `Classify user intent:

User message: "${userMessage}"

Intent categories:
1. transactional: Create, modify, delete, or list expenses
2. qa: Questions about policies
3. reconciliation: Compare or analyze reports
4. clarification: Unclear requests

Respond with JSON: {"intent": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

  const response = await llm.invoke(prompt);
  const { intent, confidence, reasoning } = JSON.parse(response.content);
  
  return {
    intent,  // "transactional"
    intentConfidence: confidence,  // 0.95
    intentReasoning: reasoning,
    steps: ["classified"]
  };
};

// LangSmith trace:
// classifyIntent (0.5s, $0.0010)
// ├─ Input: "Add 500 for lunch"
// └─ Output: { intent: "transactional", confidence: 0.95 }
```

#### **Step 4: Conditional Routing (LangGraph)**

```javascript
// File: src/graphs/intentRouter.graph.js

graph.addConditionalEdges(
  "classify_intent",
  (state) => {
    // Low confidence → clarification
    if (state.intentConfidence < 0.6) {
      return "clarification";
    }
    
    // High confidence → route by intent
    return state.intent;  // "transactional"
  },
  {
    transactional: "transactional_handler",
    qa: "qa_handler",
    reconciliation: "reconciliation_handler",
    clarification: "clarification_handler"
  }
);

// Router decision: confidence 0.95 → transactional_handler
```

#### **Step 5: Agent Execution (transactionalHandler)**

```javascript
// File: src/handlers/transactionalHandler.js

export const transactionalHandler = async (state, config) => {
  const { userMessage } = state;
  const { userId, authToken } = config.configurable;
  
  // Create agent with tools
  const tools = [
    new CreateExpenseTool(authToken, { userId }),
    new ListExpensesTool(authToken, { userId }),
    new DeleteExpenseTool(authToken, { userId })
  ];
  
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    tags: getTraceTags("transactional", userId),
    metadata: getTraceMetadata(config.configurable.traceId, userId, {
      handler: "transactionalHandler"
    })
  });
  
  const agent = new AgentExecutor({ llm, tools });
  
  const result = await agent.invoke({
    input: userMessage  // "Add 500 for lunch"
  });
  
  return {
    finalResponse: result.output,
    steps: ["transactional_completed"]
  };
};

// LangSmith trace:
// transactionalHandler (1.0s, $0.0035)
// ├─ AgentExecutor
// │  ├─ LLM Call 1 - Planning (0.6s, $0.0020)
// │  │  ├─ Reasoning: "Need to create expense with amount 500, category Food"
// │  │  └─ Action: tool_calls = [{ name: "CreateExpenseTool", args: {...} }]
// │  ├─ Tool: CreateExpenseTool (0.3s, $0)
// │  │  └─ API Call: POST /api/expenses { amount: 500, category: "Food", description: "Lunch" }
// │  │  └─ Result: { success: true, expenseId: 123 }
// │  └─ LLM Call 2 - Final Answer (0.1s, $0.0015)
// │     └─ Output: "✅ Expense created: Lunch - ₹500"
// └─ Return: { finalResponse: "✅ Expense created: Lunch - ₹500" }
```

#### **Step 6: Tool Execution (CreateExpenseTool)**

```javascript
// File: src/tools/createExpense.tool.js

import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { backendClient } from "../utils/backendClient.js";

export class CreateExpenseTool extends StructuredTool {
  name = "CreateExpenseTool";
  description = "Create a new expense. Use when user wants to add/create an expense.";
  
  schema = z.object({
    amount: z.number().describe("Expense amount in rupees"),
    category: z.enum(["Food", "Transport", "Shopping", "Entertainment", "Bills", "Healthcare", "Education", "Other"]),
    description: z.string().describe("Brief description of expense"),
    date: z.string().optional().describe("Date in YYYY-MM-DD format (defaults to today)")
  });
  
  constructor(authToken, context) {
    super();
    this.authToken = authToken;
    this.userId = context.userId;
  }
  
  async _call({ amount, category, description, date }) {
    try {
      const response = await backendClient.post('/api/expenses', {
        userId: this.userId,
        amount,
        category,
        description,
        date: date || new Date().toISOString().split('T')[0]
      }, {
        headers: {
          'Authorization': this.authToken
        }
      });
      
      return JSON.stringify({
        success: true,
        expenseId: response.data.id,
        message: `Expense created: ${description} - ₹${amount}`
      });
      
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.response?.data?.message || error.message
      });
    }
  }
}

// LangSmith trace:
// CreateExpenseTool (0.3s, $0)
// ├─ Input: { amount: 500, category: "Food", description: "Lunch" }
// ├─ API Call: POST http://localhost:3000/api/expenses
// └─ Output: {"success": true, "expenseId": 123, "message": "..."}
```

#### **Step 7: Response to Frontend**

```javascript
// Final response from IntentRouter graph
{
  userMessage: "Add 500 for lunch",
  intent: "transactional",
  intentConfidence: 0.95,
  finalResponse: "✅ Expense created: Lunch - ₹500",
  steps: ["classified", "transactional_completed"]
}

// Express route returns to frontend
res.json({
  answer: "✅ Expense created: Lunch - ₹500",
  intent: "transactional",
  confidence: 0.95,
  runId: "..." // For feedback
});
```

#### **Step 8: Frontend Display**

```typescript
// Frontend displays response
sendMessage(message: string) {
  this.aiService.sendMessage(message).subscribe(response => {
    this.messages.push({
      role: 'assistant',
      content: response.answer,
      runId: response.runId
    });
    
    // Show feedback buttons
    this.showFeedbackButtons = true;
  });
}
```

### 44.4 Complete LangSmith Trace

```
Trace: Chat Request (1.5s, $0.0045)
Tags: ["production", "user-456", "v1.0.0"]
Metadata: { userId: 456, timestamp: "...", feature: "chat" }

└─ IntentRouterGraph (1.5s, $0.0045)
   ├─ classifyIntent (0.5s, $0.0010)
   │  ├─ ChatOpenAI (gpt-4o-mini)
   │  │  ├─ Prompt: 150 tokens
   │  │  ├─ Completion: 50 tokens
   │  │  └─ Cost: $0.0010
   │  └─ Output: { intent: "transactional", confidence: 0.95 }
   │
   ├─ Router Decision: transactional (high confidence)
   │
   └─ transactionalHandler (1.0s, $0.0035)
      └─ AgentExecutor
         ├─ LLM Call 1 - Planning (0.6s, $0.0020)
         │  ├─ Prompt: 400 tokens (system + tools + user message)
         │  ├─ Completion: 80 tokens (tool call)
         │  └─ Cost: $0.0020
         │
         ├─ Tool: CreateExpenseTool (0.3s, $0)
         │  ├─ Input: { amount: 500, category: "Food", description: "Lunch" }
         │  ├─ Backend API: POST /api/expenses
         │  └─ Output: { success: true, expenseId: 123 }
         │
         └─ LLM Call 2 - Final Answer (0.1s, $0.0015)
            ├─ Prompt: 480 tokens (previous + tool result)
            ├─ Completion: 20 tokens
            ├─ Cost: $0.0015
            └─ Output: "✅ Expense created: Lunch - ₹500"

Total: 1.5s, $0.0045, 1200 tokens
```

**✅ You now understand ai-langx/ Complete Flow!**

---

## Chapter 45: Production Best Practices

### 45.1 Error Handling

#### **Classify Errors**

```javascript
// File: src/utils/errorClassification.js

export const classifyError = (error) => {
  // Rate limit
  if (error.status === 429 || error.message.includes('rate limit')) {
    return {
      type: 'RATE_LIMIT',
      userMessage: 'Too many requests. Please try again in a moment.',
      retryable: true,
      retryAfter: 60000  // 1 minute
    };
  }
  
  // Timeout
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      userMessage: 'Request timed out. Please try again.',
      retryable: true,
      retryAfter: 1000
    };
  }
  
  // Authentication
  if (error.status === 401 || error.status === 403) {
    return {
      type: 'AUTH_ERROR',
      userMessage: 'Authentication failed. Please log in again.',
      retryable: false
    };
  }
  
  // Backend API error
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return {
      type: 'CLIENT_ERROR',
      userMessage: error.response.data.message || 'Invalid request.',
      retryable: false
    };
  }
  
  // Server error
  if (error.response?.status >= 500) {
    return {
      type: 'SERVER_ERROR',
      userMessage: 'Server error. Our team has been notified.',
      retryable: true,
      retryAfter: 5000
    };
  }
  
  // Unknown
  return {
    type: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    retryAfter: 3000
  };
};
```

#### **Error Handler Middleware**

```javascript
// File: src/middleware/errorHandler.js

export const errorHandlerMiddleware = (error, req, res, next) => {
  const classified = classifyError(error);
  
  // Log to console (or logging service)
  console.error('[Error]', {
    type: classified.type,
    message: error.message,
    stack: error.stack,
    userId: req.user?.id,
    endpoint: req.path
  });
  
  // Log to LangSmith (if trace exists)
  // (Automatic via LangSmith error tracking)
  
  // Response to client
  res.status(error.status || 500).json({
    error: classified.userMessage,
    type: classified.type,
    retryable: classified.retryable,
    retryAfter: classified.retryAfter
  });
};
```

### 45.2 Rate Limiting

```javascript
// File: src/middleware/rateLimit.js

import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,  // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,  // 20 requests
  
  // Key by user ID (from JWT)
  keyGenerator: (req) => {
    return req.user?.id?.toString() || req.ip;
  },
  
  // Custom handler
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 60
    });
  },
  
  // Skip for health checks
  skip: (req) => req.path === '/health'
});
```

### 45.3 Caching Strategies

#### **1. Response Caching** (Exact query match)

```javascript
// File: src/middleware/responseCache.js

import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600,  // 1 hour
  checkperiod: 600  // Cleanup every 10 minutes
});

export const responseCacheMiddleware = (req, res, next) => {
  if (req.method !== 'POST' || !process.env.ENABLE_RESPONSE_CACHE) {
    return next();
  }
  
  // Cache key: userId + message
  const cacheKey = `${req.user.id}:${req.body.message}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('[Cache] Hit:', cacheKey);
    return res.json({ ...cached, cached: true });
  }
  
  // Cache miss, continue to handler
  const originalJson = res.json;
  res.json = function (data) {
    // Store in cache before sending
    cache.set(cacheKey, data);
    originalJson.call(this, data);
  };
  
  next();
};
```

#### **2. LLM Caching**

```javascript
// File: src/config/llm.config.js

import { ChatOpenAI } from "@langchain/openai";
import { InMemoryCache } from "@langchain/core/caches";

const cache = new InMemoryCache();

export const createCachedLLM = (modelName = "gpt-4o-mini") => {
  return new ChatOpenAI({
    modelName,
    cache: process.env.ENABLE_LLM_CACHE === 'true' ? cache : undefined
  });
};

// Usage
const llm = createCachedLLM("gpt-4o-mini");
```

#### **3. Embedding Caching**

```javascript
// File: src/rag/embeddings.js

import { OpenAIEmbeddings } from "@langchain/openai";
import { CacheBackedEmbeddings } from "langchain/embeddings/cache_backed";
import { InMemoryStore } from "langchain/storage/in_memory";

const underlyingEmbeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small"
});

const store = new InMemoryStore();

export const embeddings = CacheBackedEmbeddings.fromBytesStore(
  underlyingEmbeddings,
  store,
  {
    namespace: "ai-langx-embeddings"
  }
);

// Same text → cached embedding (no API call)
```

### 45.4 Monitoring & Alerts

```javascript
// File: scripts/monitorProduction.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

// Run every 15 minutes
setInterval(async () => {
  const last15min = new Date(Date.now() - 15 * 60 * 1000);
  
  const runs = await client.listRuns({
    projectName: "ai-langx-prod",
    startTime: last15min
  });
  
  // Calculate metrics
  const errors = runs.filter(r => r.error);
  const errorRate = errors.length / runs.length;
  
  const latencies = runs.map(r => r.latency);
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
  
  const totalCost = runs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  
  // Alerts
  if (errorRate > 0.05) {
    await sendAlert('🚨 Error Rate Alert', `Error rate: ${(errorRate * 100).toFixed(1)}%`);
  }
  
  if (p95Latency > 5000) {
    await sendAlert('⚠️ Latency Alert', `p95 latency: ${p95Latency}ms`);
  }
  
  if (totalCost > 2) {  // $2 per 15 min = $192/day
    await sendAlert('💰 Cost Alert', `Cost in last 15 min: $${totalCost.toFixed(2)}`);
  }
  
}, 15 * 60 * 1000);
```

### 45.5 Logging

```javascript
// File: src/utils/logger.js

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack,
        ...error
      },
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  }
};

// Usage
logger.info('User message received', { userId: 456, message: "Add expense" });
logger.error('LLM call failed', error, { userId: 456, model: "gpt-4o-mini" });
```

**✅ You now understand Production Best Practices!**

---

## Chapter 46: Error Handling & Recovery

### 46.1 Retry Strategies

#### **Exponential Backoff**

```javascript
// File: src/utils/retry.js

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Last attempt, give up
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s, ...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      console.log(`[Retry] Attempt ${attempt} failed, retrying after ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Usage
const result = await retryWithBackoff(async () => {
  return await llm.invoke(prompt);
}, 3, 1000);
```

#### **Tool with Retry**

```javascript
// File: src/tools/createExpense.tool.js (with retry)

async _call({ amount, category, description, date }) {
  return await retryWithBackoff(async () => {
    try {
      const response = await backendClient.post('/api/expenses', {
        userId: this.userId,
        amount,
        category,
        description,
        date: date || new Date().toISOString().split('T')[0]
      }, {
        headers: { 'Authorization': this.authToken },
        timeout: 10000  // 10s timeout
      });
      
      return JSON.stringify({
        success: true,
        expenseId: response.data.id
      });
      
    } catch (error) {
      // Classify error
      const classified = classifyError(error);
      
      // Retryable error → throw (retry will catch)
      if (classified.retryable) {
        throw error;
      }
      
      // Non-retryable → return error message
      return JSON.stringify({
        success: false,
        error: classified.userMessage
      });
    }
  }, 3, 1000);
}
```

### 46.2 Circuit Breaker Pattern

```javascript
// File: src/utils/circuitBreaker.js

export class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;  // Open after N failures
    this.timeout = timeout;  // Stay open for N ms
    this.state = 'CLOSED';  // CLOSED | OPEN | HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try again (HALF_OPEN)
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      
      // Success → close circuit
      this.onSuccess();
      return result;
      
    } catch (error) {
      // Failure → record
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`[CircuitBreaker] Opened (${this.failureCount} failures)`);
    }
  }
  
  getState() {
    return this.state;
  }
}

// Usage
const backendCircuit = new CircuitBreaker(5, 60000);

try {
  const result = await backendCircuit.execute(async () => {
    return await backendClient.get('/api/expenses');
  });
} catch (error) {
  if (error.message === 'Circuit breaker is OPEN') {
    // Backend is down, use fallback
    return { expenses: [], cached: true };
  }
  throw error;
}
```

### 46.3 Graceful Degradation

```javascript
// File: src/handlers/ragQaHandler.js (with fallback)

export const ragQaHandler = async (state, config) => {
  const { userMessage } = state;
  
  try {
    // Try RAG pipeline
    const docs = await retriever.getRelevantDocuments(userMessage);
    
    if (docs.length === 0) {
      // No relevant docs found → fallback to general LLM
      return await generalLLMFallback(userMessage, config);
    }
    
    const answer = await ragChain.invoke({ question: userMessage, context: docs });
    return { finalResponse: answer, sources: docs };
    
  } catch (error) {
    console.error('[RAG] Error:', error);
    
    // RAG failed → fallback to general LLM
    return await generalLLMFallback(userMessage, config);
  }
};

const generalLLMFallback = async (userMessage, config) => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    tags: ["fallback", ...getTraceTags("qa-fallback", config.configurable.userId)]
  });
  
  const response = await llm.invoke(
    `Answer this expense policy question: ${userMessage}\n\nNote: I don't have access to the latest policy documents, so this is general guidance.`
  );
  
  return {
    finalResponse: response.content,
    sources: [],
    fallback: true
  };
};
```

### 46.4 Timeout Handling

```javascript
// File: src/utils/timeout.js

export const withTimeout = (promise, timeoutMs, errorMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage || 'Operation timed out')), timeoutMs)
    )
  ]);
};

// Usage
try {
  const result = await withTimeout(
    llm.invoke(prompt),
    30000,  // 30s timeout
    'LLM call timed out after 30 seconds'
  );
} catch (error) {
  if (error.message.includes('timed out')) {
    // Handle timeout
    return { finalResponse: "Sorry, that took too long. Please try a simpler query." };
  }
  throw error;
}
```

### 46.5 Partial Failure Handling (Parallel Operations)

```javascript
// In LangGraph with parallel nodes

const StateAnnotation = Annotation.Root({
  results: Annotation<any[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  errors: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  })
});

// Each parallel node handles its own errors
const fetchExpensesNode = async (state) => {
  try {
    const expenses = await fetchExpenses();
    return { results: [{ type: 'expenses', data: expenses }] };
  } catch (error) {
    return { errors: [`Failed to fetch expenses: ${error.message}`] };
  }
};

const fetchCategoriesNode = async (state) => {
  try {
    const categories = await fetchCategories();
    return { results: [{ type: 'categories', data: categories }] };
  } catch (error) {
    return { errors: [`Failed to fetch categories: ${error.message}`] };
  }
};

// Aggregator checks what succeeded
const aggregatorNode = async (state) => {
  if (state.errors.length > 0) {
    console.warn('Some operations failed:', state.errors);
  }
  
  if (state.results.length === 0) {
    throw new Error('All operations failed');
  }
  
  // Continue with partial results
  return { finalResult: state.results };
};
```

**✅ You now understand Error Handling & Recovery!**

---

## Chapter 47: Performance Optimization

### 47.1 Token Usage Optimization

#### **Reduce System Prompt Size**

```javascript
// ❌ Bad: 500 tokens
const verboseSystemPrompt = `You are an expense management assistant...
[500 tokens of detailed instructions, examples, edge cases]`;

// ✅ Good: 100 tokens
const conciseSystemPrompt = `You are an expense assistant. Help users create, list, and manage expenses.

Categories: Food, Transport, Shopping, Entertainment, Bills, Healthcare, Education, Other

Use tools to interact with the expense system.`;

// Savings: 400 tokens × $0.0001/1k = $0.00004 per call
// At 100k calls/month: $4/month saved
```

#### **Summarize Conversation History**

```javascript
// ❌ Bad: Send entire conversation (grows unbounded)
const messages = conversationHistory;  // 50 messages = 5000 tokens

// ✅ Good: Keep only last N messages
const messages = conversationHistory.slice(-5);  // Last 5 = 500 tokens

// ✅ Better: Summarize old messages
const recentMessages = conversationHistory.slice(-5);
const oldMessages = conversationHistory.slice(0, -5);

const summary = await llm.invoke(
  `Summarize this conversation in 2-3 sentences:\n${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
);

const messages = [
  { role: 'system', content: `Previous conversation summary: ${summary}` },
  ...recentMessages
];
```

#### **Trim Tool Descriptions**

```javascript
// ❌ Bad: Verbose tool descriptions (200 tokens per tool)
description: `This tool creates a new expense in the system. It accepts the following parameters: amount (required, positive number), category (required, one of Food, Transport, Shopping, Entertainment, Bills, Healthcare, Education, Other), description (required, string, up to 500 characters), date (optional, ISO format YYYY-MM-DD, defaults to today). The tool will validate the input and return a success message with the expense ID if successful, or an error message if validation fails.`;

// ✅ Good: Concise (40 tokens)
description: "Create expense. Required: amount (number), category (Food|Transport|...), description (string). Optional: date (YYYY-MM-DD).";

// Savings: 160 tokens × 3 tools = 480 tokens per agent call
```

### 47.2 Latency Optimization

#### **Parallel API Calls**

```javascript
// ❌ Bad: Sequential (1.5s total)
const expenses = await fetchExpenses();  // 500ms
const categories = await fetchCategories();  // 500ms
const reports = await fetchReports();  // 500ms

// ✅ Good: Parallel (500ms total)
const [expenses, categories, reports] = await Promise.all([
  fetchExpenses(),
  fetchCategories(),
  fetchReports()
]);
```

#### **Streaming LLM Responses**

```javascript
// File: src/routes/chat.js (streaming endpoint)

router.post('/stream', async (req, res) => {
  const { message, userId } = req.body;
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    streaming: true
  });
  
  try {
    const stream = await llm.stream(message);
    
    for await (const chunk of stream) {
      // Send each token immediately
      res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
    }
    
    res.write(`data: [DONE]\n\n`);
    res.end();
    
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// User sees response appear gradually (perceived latency reduced)
```

#### **Caching**

```javascript
// Cache expensive operations

// 1. Embedding cache (covered in Chapter 45)
const cachedEmbeddings = CacheBackedEmbeddings.fromBytesStore(...);

// 2. LLM cache for repeated queries
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  cache: new InMemoryCache()
});

// 3. Response cache for exact matches
// (covered in Chapter 45)
```

#### **Reduce Retrieval Size**

```javascript
// ❌ Bad: Retrieve large chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,  // Large chunks
  chunkOverlap: 400
});

const retriever = vectorStore.asRetriever({ k: 10 });  // 10 chunks

// Total context: 2000 × 10 = 20,000 tokens → slow LLM call

// ✅ Good: Retrieve smaller, more focused chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,  // Smaller chunks
  chunkOverlap: 50
});

const retriever = vectorStore.asRetriever({ k: 4 });  // 4 chunks

// Total context: 500 × 4 = 2,000 tokens → fast LLM call
```

### 47.3 Cost Optimization

#### **Use Cheaper Models for Simple Tasks**

```javascript
// ❌ Bad: GPT-4 for everything ($30/1M tokens)
const llm = new ChatOpenAI({ modelName: "gpt-4" });

// ✅ Good: GPT-4o-mini for most tasks ($0.15/1M tokens)
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// ✅ Best: Route by complexity
const llmRouter = (task) => {
  if (task.complexity === 'high') {
    return new ChatOpenAI({ modelName: "gpt-4" });
  } else {
    return new ChatOpenAI({ modelName: "gpt-4o-mini" });
  }
};

// Savings: 200x cost reduction for simple tasks
```

#### **Reduce Embedding Costs**

```javascript
// ❌ Bad: text-embedding-3-large ($0.13/1M tokens)
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large"
});

// ✅ Good: text-embedding-3-small ($0.02/1M tokens)
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small"
});

// Savings: 6.5x cost reduction
// Quality: Still excellent for most use cases
```

#### **Batch Operations**

```javascript
// ❌ Bad: Embed documents one-by-one (N API calls)
for (const doc of documents) {
  const embedding = await embeddings.embedQuery(doc);
}

// ✅ Good: Batch embedding (1 API call)
const embeddings_list = await embeddings.embedDocuments(
  documents.map(d => d.pageContent)
);

// Savings: Reduce API overhead, potential bulk pricing
```

### 47.4 Monitoring Performance

```javascript
// File: scripts/analyzePerformance.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

const runs = await client.listRuns({
  projectName: "ai-langx-prod",
  startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)  // Last 7 days
});

// Analyze token usage
const tokenStats = {
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  byModel: {}
};

runs.forEach(run => {
  if (run.promptTokens) {
    tokenStats.totalPromptTokens += run.promptTokens;
    tokenStats.totalCompletionTokens += run.completionTokens || 0;
    
    const model = run.extra?.invocation_params?.model_name;
    if (model) {
      if (!tokenStats.byModel[model]) {
        tokenStats.byModel[model] = { prompt: 0, completion: 0 };
      }
      tokenStats.byModel[model].prompt += run.promptTokens;
      tokenStats.byModel[model].completion += run.completionTokens || 0;
    }
  }
});

console.log('Token Usage (Last 7 Days):');
console.log(`Total Prompt Tokens: ${tokenStats.totalPromptTokens.toLocaleString()}`);
console.log(`Total Completion Tokens: ${tokenStats.totalCompletionTokens.toLocaleString()}`);
console.log(`\nBy Model:`);
Object.entries(tokenStats.byModel).forEach(([model, tokens]) => {
  console.log(`  ${model}:`);
  console.log(`    Prompt: ${tokens.prompt.toLocaleString()}`);
  console.log(`    Completion: ${tokens.completion.toLocaleString()}`);
});

// Identify optimization opportunities
const avgPromptTokens = tokenStats.totalPromptTokens / runs.length;
if (avgPromptTokens > 1000) {
  console.log(`\n⚠️ High average prompt tokens (${avgPromptTokens.toFixed(0)}). Consider:`);
  console.log('  - Shorter system prompts');
  console.log('  - Summarize conversation history');
  console.log('  - Trim tool descriptions');
}
```

**✅ You now understand Performance Optimization!**

---

## Chapter 48: Security & Authentication

### 48.1 JWT Authentication

```javascript
// File: src/middleware/auth.js

import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 48.2 Input Validation

```javascript
// File: src/validators/chatRequest.validator.js

import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)'),
  
  conversationId: z.string().uuid().optional()
});

export const validateChatRequest = (req, res, next) => {
  try {
    chatRequestSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid request',
      details: error.errors
    });
  }
};

// Use in route
router.post('/chat', authMiddleware, validateChatRequest, async (req, res) => {
  // req.body is validated
});
```

### 48.3 Sanitize User Input

```javascript
// File: src/utils/sanitize.js

export const sanitizeInput = (input) => {
  // Remove potential injection attacks
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove HTML tags
    .replace(/javascript:/gi, '')  // Remove javascript: protocol
    .replace(/on\w+=/gi, '')  // Remove event handlers
    .slice(0, 2000);  // Limit length
};

// Use before LLM
const sanitizedMessage = sanitizeInput(req.body.message);
const result = await llm.invoke(sanitizedMessage);
```

### 48.4 API Key Security

```javascript
// ❌ Bad: API keys in code
const llm = new ChatOpenAI({
  apiKey: "sk-proj-abc123..."  // NEVER DO THIS!
});

// ✅ Good: API keys in environment variables
const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Best: Use secret manager (AWS Secrets Manager, Azure Key Vault)
const apiKey = await getSecretFromVault('openai-api-key');
const llm = new ChatOpenAI({ apiKey });
```

### 48.5 Rate Limiting by User

```javascript
// Different limits for different user tiers

export const createRateLimiter = (tier) => {
  const limits = {
    free: { windowMs: 60000, max: 5 },      // 5 req/min
    basic: { windowMs: 60000, max: 20 },    // 20 req/min
    premium: { windowMs: 60000, max: 100 }  // 100 req/min
  };
  
  const limit = limits[tier] || limits.free;
  
  return rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => req.user.id
  });
};

// Use in route
router.post('/chat', authMiddleware, (req, res, next) => {
  const limiter = createRateLimiter(req.user.tier);
  limiter(req, res, next);
}, chatHandler);
```

### 48.6 CORS Configuration

```javascript
// File: server.js

import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:4200',  // Dev
      'https://app.example.com'  // Prod
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 48.7 Content Security Policy

```javascript
// File: src/middleware/security.js

import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.openai.com', 'https://api.smith.langchain.com']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

app.use(securityMiddleware);
```

**✅ You now understand Security & Authentication!**

---

## Chapter 49: Deployment Strategies

### 49.1 Environment Configuration

```bash
# .env.development
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=sk-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=ai-langx-dev
BACKEND_API_URL=http://localhost:3000

# .env.production
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=ai-langx-prod
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
BACKEND_API_URL=https://api.example.com
RATE_LIMIT_MAX_REQUESTS=20
ENABLE_LLM_CACHE=true
```

### 49.2 Docker Deployment

```dockerfile
# Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  ai-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
      - LANGCHAIN_TRACING_V2=true
      - LANGCHAIN_PROJECT=ai-langx-prod
      - BACKEND_API_URL=http://backend:3000
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
  
  backend:
    image: your-backend-image
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

### 49.3 Kubernetes Deployment

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-langx
  labels:
    app: ai-langx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-langx
  template:
    metadata:
      labels:
        app: ai-langx
    spec:
      containers:
      - name: ai-langx
        image: your-registry/ai-langx:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        - name: LANGCHAIN_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: langchain-api-key
        - name: LANGCHAIN_TRACING_V2
          value: "true"
        - name: LANGCHAIN_PROJECT
          value: "ai-langx-prod"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ai-langx-service
spec:
  selector:
    app: ai-langx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

### 49.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run LangSmith evaluation
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
          LANGCHAIN_TRACING_V2: "true"
          LANGCHAIN_PROJECT: "ai-langx-ci"
        run: node scripts/runDatasetTest.js
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t your-registry/ai-langx:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push your-registry/ai-langx:${{ github.sha }}
          docker tag your-registry/ai-langx:${{ github.sha }} your-registry/ai-langx:latest
          docker push your-registry/ai-langx:latest
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ai-langx ai-langx=your-registry/ai-langx:${{ github.sha }}
          kubectl rollout status deployment/ai-langx
```

### 49.5 Blue-Green Deployment

```bash
# Deploy new version (green) while old version (blue) is running

# 1. Deploy green version
kubectl apply -f deployment-green.yaml

# 2. Wait for green to be healthy
kubectl rollout status deployment/ai-langx-green

# 3. Run smoke tests on green
./scripts/smokeTest.sh https://green.example.com

# 4. Switch traffic to green
kubectl patch service ai-langx-service -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for errors
./scripts/monitorErrors.sh

# 6. If errors, rollback to blue
kubectl patch service ai-langx-service -p '{"spec":{"selector":{"version":"blue"}}}'

# 7. If stable, delete blue
kubectl delete deployment ai-langx-blue
```

### 49.6 Monitoring After Deployment

```javascript
// File: scripts/postDeploymentCheck.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

// Wait 5 minutes after deployment
await sleep(5 * 60 * 1000);

// Check last 5 minutes
const runs = await client.listRuns({
  projectName: "ai-langx-prod",
  startTime: new Date(Date.now() - 5 * 60 * 1000)
});

// Calculate error rate
const errors = runs.filter(r => r.error);
const errorRate = errors.length / runs.length;

console.log(`Post-Deployment Check:`);
console.log(`- Total Runs: ${runs.length}`);
console.log(`- Errors: ${errors.length}`);
console.log(`- Error Rate: ${(errorRate * 100).toFixed(1)}%`);

// Alert if error rate > 5%
if (errorRate > 0.05) {
  console.error('🚨 HIGH ERROR RATE DETECTED! Consider rollback.');
  process.exit(1);
}

console.log('✅ Deployment looks healthy');
```

**✅ You now understand Deployment Strategies!**

---

## Chapter 50: Troubleshooting Guide

### 50.1 Common Issue #1: "Model not found"

**Error**:
```
Error: The model `gpt-4o-mini` does not exist or you do not have access to it.
```

**Causes**:
- Typo in model name
- API key doesn't have access to model
- Using deprecated model

**Solutions**:

```javascript
// 1. Check model name spelling
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini"  // Correct spelling
});

// 2. Verify API key has access
// Go to OpenAI dashboard → API Keys → Check permissions

// 3. Use available model
const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo"  // Fallback to widely available model
});

// 4. List available models (for debugging)
import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const models = await openai.models.list();
console.log(models.data.map(m => m.id));
```

### 50.2 Common Issue #2: "Context length exceeded"

**Error**:
```
Error: This model's maximum context length is 8192 tokens. However, your messages resulted in 10543 tokens.
```

**Causes**:
- Large RAG context (too many documents)
- Long conversation history
- Verbose system prompt

**Solutions**:

```javascript
// 1. Reduce retrieved documents
const retriever = vectorStore.asRetriever({
  k: 4  // Reduce from 10 to 4
});

// 2. Use smaller chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,  // Reduce from 1000
  chunkOverlap: 50
});

// 3. Summarize conversation
const recentMessages = messages.slice(-5);  // Only last 5 messages

// 4. Token counting before call
import { encoding_for_model } from "tiktoken";

const enc = encoding_for_model("gpt-4o-mini");
const tokens = enc.encode(prompt);

if (tokens.length > 8000) {
  // Truncate or summarize
  prompt = truncatePrompt(prompt, 8000);
}

// 5. Use model with larger context
const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo"  // 128k tokens vs 8k
});
```

### 50.3 Common Issue #3: "Too many tokens"

**Error**:
```
Error: Your request included 20000 tokens but your budget is 10000 tokens per day.
```

**Causes**:
- Account token limit reached
- Too many requests
- Large prompts

**Solutions**:

```javascript
// 1. Monitor token usage
// Use LangSmith dashboard to see token consumption

// 2. Implement daily budget check
let dailyTokenCount = 0;
const DAILY_LIMIT = 1000000;  // 1M tokens/day

const llmWithBudget = async (prompt) => {
  if (dailyTokenCount > DAILY_LIMIT) {
    throw new Error('Daily token budget exceeded');
  }
  
  const result = await llm.invoke(prompt);
  dailyTokenCount += result.usage.totalTokens;
  
  return result;
};

// 3. Cache responses
// (see Chapter 45 for caching strategies)

// 4. Upgrade OpenAI plan
// Go to OpenAI dashboard → Billing → Increase limits
```

### 50.4 Common Issue #4: "Rate limit exceeded"

**Error**:
```
Error: Rate limit exceeded. Please retry after 60 seconds.
```

**Causes**:
- Too many requests per minute
- Burst of traffic

**Solutions**:

```javascript
// 1. Implement retry with exponential backoff (Chapter 46)
const result = await retryWithBackoff(async () => {
  return await llm.invoke(prompt);
}, 3, 1000);

// 2. Use rate limiter on frontend
// Allow 5 requests per minute per user

// 3. Batch operations
// Instead of N sequential calls, use batching

const results = await llm.batch([
  { messages: [...] },
  { messages: [...] },
  { messages: [...] }
]);

// 4. Queue system (for high traffic)
import Bull from 'bull';

const llmQueue = new Bull('llm-requests');

llmQueue.process(async (job) => {
  const { prompt } = job.data;
  return await llm.invoke(prompt);
});

// Add to queue instead of calling directly
llmQueue.add({ prompt });
```

### 50.5 Common Issue #5: "Poor RAG results"

**Error**: LLM returns wrong answer despite having correct info in docs

**Causes**:
- Poor retrieval (wrong docs fetched)
- Poor chunking (info split across chunks)
- LLM ignoring context

**Solutions**:

```javascript
// 1. Check retrieval quality
const docs = await retriever.getRelevantDocuments(query);
console.log('Retrieved docs:');
docs.forEach((doc, i) => {
  console.log(`${i+1}. Score: ${doc.metadata.score} - ${doc.pageContent.substring(0, 100)}...`);
});

// Are relevant docs in top results? If not:

// 2. Improve chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,  // Larger chunks keep context together
  chunkOverlap: 200  // More overlap prevents info loss
});

// 3. Use better embeddings
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large"  // Better quality
});

// 4. Try MMR retrieval (diversity)
const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  searchKwargs: { fetchK: 20, lambda: 0.5 },
  k: 4
});

// 5. Explicitly instruct LLM to use context
const prompt = `Answer based ONLY on the provided context. Do not use external knowledge.

Context:
${docs.map(d => d.pageContent).join('\n\n')}

Question: ${query}

Answer:`;
```

### 50.6 Common Issue #6: "Agent loops infinitely"

**Error**: Agent keeps calling tools without reaching final answer

**Causes**:
- Tool returns confusing output
- No clear termination condition
- LLM stuck in loop

**Solutions**:

```javascript
// 1. Set maxIterations limit
const agent = new AgentExecutor({
  llm,
  tools,
  maxIterations: 10,  // Stop after 10 steps
  earlyStoppingMethod: "generate"  // Force final answer
});

// 2. Improve tool output format
class CreateExpenseTool extends StructuredTool {
  async _call(input) {
    const result = await createExpense(input);
    
    // ✅ Clear success/failure indication
    if (result.success) {
      return `SUCCESS: Expense created with ID ${result.id}. You can now provide final answer to user.`;
    } else {
      return `ERROR: ${result.error}. Inform user about the error.`;
    }
  }
}

// 3. Add explicit final answer instruction
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  systemMessage: `After calling tools, ALWAYS provide a final answer to the user. Do not call the same tool repeatedly.`
});

// 4. Monitor in LangSmith
// Check trace to see where loop starts
```

### 50.7 Common Issue #7: "LangSmith not logging"

**Error**: No traces appearing in LangSmith dashboard

**Causes**:
- Environment variables not set
- Wrong API key
- Network issues

**Solutions**:

```javascript
// 1. Check environment variables
console.log('LANGCHAIN_TRACING_V2:', process.env.LANGCHAIN_TRACING_V2);
console.log('LANGCHAIN_API_KEY:', process.env.LANGCHAIN_API_KEY ? 'Set' : 'Not set');
console.log('LANGCHAIN_PROJECT:', process.env.LANGCHAIN_PROJECT);

// Must output:
// LANGCHAIN_TRACING_V2: true
// LANGCHAIN_API_KEY: Set
// LANGCHAIN_PROJECT: your-project-name

// 2. Verify API key
// Go to smith.langchain.com → Settings → API Keys
// Make sure key is active

// 3. Test connection
import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

try {
  const projects = await client.listProjects();
  console.log('✅ LangSmith connection successful');
  console.log('Projects:', projects.map(p => p.name));
} catch (error) {
  console.error('❌ LangSmith connection failed:', error.message);
}

// 4. Check firewall/proxy
// LangSmith endpoint: https://api.smith.langchain.com
// Make sure it's not blocked

// 5. Use callback for debugging
import { LangChainTracer } from "langchain/callbacks";

const tracer = new LangChainTracer({
  projectName: "ai-langx-debug"
});

const result = await llm.invoke("Hello", {
  callbacks: [tracer]
});

// If trace appears, environment vars are the issue
```

### 50.8 Debugging Checklist

When something goes wrong:

1. **Check LangSmith trace**
   - Which step failed?
   - What were inputs/outputs?
   - Error message?

2. **Check logs**
   - Console errors?
   - Backend API errors?

3. **Check environment vars**
   - All required vars set?
   - Correct values?

4. **Check network**
   - OpenAI API accessible?
   - LangSmith API accessible?
   - Backend API accessible?

5. **Check authentication**
   - JWT token valid?
   - API keys valid?

6. **Reproduce in isolation**
   - Create minimal test case
   - Remove all other code
   - Test single LLM call

7. **Check for updates**
   - LangChain version up to date?
   - Breaking changes in changelog?

**✅ You now understand Troubleshooting!**

---

## Conclusion: Building Production AI Systems

### What You've Learned

**Parts 1-4: Foundations**
- LangChain primitives (models, prompts, tools, agents, chains, memory)
- RAG pipeline (loaders, splitters, embeddings, stores, retrievers)
- Advanced patterns (LCEL, runnables, parsers, callbacks, caching)

**Part 5: LangGraph**
- StateGraph for multi-step workflows
- Conditional routing and parallel execution
- Persistence and streaming
- Human-in-the-loop patterns

**Part 6: LangSmith**
- Automatic tracing and debugging
- Cost and latency monitoring
- Feedback and evaluation
- Experiments and A/B testing

**Part 7: Integration**
- Complete system architecture (ai-langx/)
- Production best practices (error handling, caching, rate limiting)
- Security and authentication
- Deployment strategies

### Checklist: Production-Ready AI System

- [ ] **Architecture**
  - [ ] LangGraph for orchestration
  - [ ] LangChain agents/RAG for execution
  - [ ] LangSmith for observability
  
- [ ] **Error Handling**
  - [ ] Retry logic with exponential backoff
  - [ ] Circuit breaker for external APIs
  - [ ] Graceful degradation
  - [ ] User-friendly error messages
  
- [ ] **Performance**
  - [ ] Caching (LLM, embeddings, responses)
  - [ ] Token optimization
  - [ ] Parallel operations
  - [ ] Streaming for better UX
  
- [ ] **Security**
  - [ ] JWT authentication
  - [ ] Input validation and sanitization
  - [ ] API keys in environment variables
  - [ ] Rate limiting per user
  - [ ] CORS configuration
  
- [ ] **Monitoring**
  - [ ] LangSmith tracing (all requests)
  - [ ] Cost monitoring with alerts
  - [ ] Latency monitoring (p95, p99)
  - [ ] Error rate tracking
  - [ ] User feedback collection
  
- [ ] **Testing**
  - [ ] Dataset with test cases
  - [ ] Automated evaluation
  - [ ] CI/CD integration
  - [ ] Smoke tests after deployment
  
- [ ] **Deployment**
  - [ ] Docker containerization
  - [ ] Health checks
  - [ ] Auto-scaling configuration
  - [ ] Blue-green deployment process
  - [ ] Rollback plan

### Next Steps

1. **Implement**: Build your production AI system using this guide
2. **Monitor**: Use LangSmith to track performance and costs
3. **Iterate**: Analyze feedback and traces to improve prompts/flows
4. **Scale**: Add more features, optimize for cost/latency
5. **Share**: Contribute back to community with learnings

### Resources

- **LangChain Docs**: https://python.langchain.com/docs/
- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **LangSmith**: https://smith.langchain.com
- **OpenAI Platform**: https://platform.openai.com
- **ai-langx/ GitHub**: [Your repository]

**🎉 Congratulations! You're now ready to build production-grade AI systems!**

---

## Quick Reference Card

### Common Commands

```bash
# Install dependencies
npm install @langchain/langgraph @langchain/core @langchain/openai langsmith

# Start development server
npm run dev

# Run tests
npm test

# Run evaluation
node scripts/runDatasetTest.js

# Build Docker image
docker build -t ai-langx .

# Run Docker container
docker run -p 3001:3001 --env-file .env ai-langx
```

### Common Patterns

```javascript
// LLM Call with Tracing
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  tags: ["production", "user-123"],
  metadata: { userId: 123 }
});

// Agent with Tools
const agent = new AgentExecutor({ llm, tools });

// RAG Pipeline
const retriever = vectorStore.asRetriever({ k: 4 });
const chain = RetrievalQAChain.fromLLM(llm, retriever);

// LangGraph Workflow
const graph = new StateGraph(StateAnnotation);
graph.addNode("step1", step1Node);
graph.addConditionalEdges("step1", router, { a: "a", b: "b" });
const workflow = graph.compile();

// Error Handling with Retry
const result = await retryWithBackoff(async () => {
  return await llm.invoke(prompt);
}, 3, 1000);
```

### Essential Environment Variables

```bash
OPENAI_API_KEY=sk-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=my-project
NODE_ENV=production
```

---

---

## 🎯 Part 7 Hands-On Challenge: Production Deployment

### Challenge: Deploy and Monitor a Complete AI System

**Objective**: Take the ai-langx/ system from development to production with full observability.

### Phase 1: Local Production Setup (30 minutes)

**Tasks**:
1. Create production environment configuration
2. Enable all monitoring and alerts
3. Implement complete error handling
4. Add security middleware
5. Test with realistic load

**Checklist**:

```bash
# 1. Create .env.production
cat > .env.production << EOF
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=ai-langx-prod
BACKEND_API_URL=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=20
ENABLE_LLM_CACHE=true
JWT_SECRET=your-secret
EOF

# 2. Start with production config
NODE_ENV=production node server.js

# 3. Run load test (100 requests)
node scripts/loadTest.js --requests 100 --concurrent 10

# 4. Check LangSmith dashboard
# - Total runs?
# - Error rate?
# - Average cost per request?
# - p95 latency?
```

**Success Criteria**:
- [ ] Server starts successfully in production mode
- [x] All requests traced in LangSmith
- [ ] Error rate < 1%
- [ ] p95 latency < 3s
- [ ] Average cost < $0.01 per request

### Phase 2: Docker Deployment (30 minutes)

**Tasks**:
1. Create Dockerfile
2. Build and test Docker image
3. Create docker-compose.yml with health checks
4. Deploy locally via Docker
5. Verify monitoring works in container

**Implementation**:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t ai-langx:v1.0.0 .

# Run
docker run -p 3001:3001 --env-file .env.production ai-langx:v1.0.0

# Test health
curl http://localhost:3001/health

# Test request
curl -X POST http://localhost:3001/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"message": "Add 500 for lunch"}'
```

**Success Criteria**:
- [ ] Docker image builds without errors
- [ ] Container starts and passes health check
- [ ] All API endpoints work in container
- [ ] LangSmith traces show correct tags (production, version)
- [ ] Logs output structured JSON

### Phase 3: Monitoring Dashboard (30 minutes)

**Tasks**:
1. Set up real-time monitoring script
2. Create alert thresholds
3. Run for 15 minutes with mixed traffic
4. Analyze results in LangSmith
5. Document findings

**Create Monitoring Script**:

```javascript
// scripts/monitorProduction.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

const monitor = async () => {
  const runs = await client.listRuns({
    projectName: "ai-langx-prod",
    startTime: new Date(Date.now() - 15 * 60 * 1000)
  });
  
  // Calculate metrics
  const total = runs.length;
  const errors = runs.filter(r => r.error).length;
  const errorRate = (errors / total) * 100;
  
  const costs = runs.filter(r => r.totalCost).map(r => r.totalCost);
  const totalCost = costs.reduce((a, b) => a + b, 0);
  const avgCost = totalCost / costs.length;
  
  const latencies = runs.filter(r => r.latency).map(r => r.latency);
  latencies.sort((a, b) => a - b);
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
  
  // Display dashboard
  console.log('\n📊 Production Dashboard (Last 15min)');
  console.log('═'.repeat(50));
  console.log(`Total Requests:     ${total}`);
  console.log(`Errors:             ${errors} (${errorRate.toFixed(1)}%)`);
  console.log(`Total Cost:         $${totalCost.toFixed(4)}`);
  console.log(`Avg Cost/Request:   $${avgCost.toFixed(6)}`);
  console.log(`p95 Latency:        ${(p95Latency / 1000).toFixed(2)}s`);
  
  // Alerts
  if (errorRate > 5) console.log('🚨 ALERT: Error rate > 5%');
  if (p95Latency > 5000) console.log('🚨 ALERT: p95 latency > 5s');
  if (totalCost > 2) console.log('🚨 ALERT: Cost > $2 in 15min');
  
  console.log('═'.repeat(50));
};

// Run every minute
setInterval(monitor, 60000);
monitor();  // Run immediately
```

```bash
# Start monitoring
node scripts/monitorProduction.js

# In another terminal, generate traffic
node scripts/loadTest.js --duration 900 --rate 2  # 900s = 15min, 2 req/s
```

**Success Criteria**:
- [ ] Dashboard updates every minute
- [ ] Metrics match LangSmith web dashboard
- [ ] Alerts trigger correctly when thresholds exceeded
- [ ] Can drill into specific errors in LangSmith
- [ ] Cost tracking accurate

### Phase 4: Troubleshooting Exercise (30 minutes)

**Scenario**: Simulate production issues and fix them

**Issue 1: High Error Rate**
```bash
# Simulate: Set wrong environment variable
BACKEND_API_URL=http://wrong-url node server.js

# Expected: Backend API calls fail
# Task: Identify issue using LangSmith traces
# Solution: Check environment variables, fix URL
```

**Issue 2: High Latency**
```javascript
// Simulate: Disable caching
process.env.ENABLE_LLM_CACHE = 'false';

// Expected: Latency increases 2-3x
// Task: Identify using LangSmith latency breakdown
// Solution: Re-enable caching
```

**Issue 3: Cost Spike**
```javascript
// Simulate: Use expensive model
const llm = new ChatOpenAI({ modelName: "gpt-4" });

// Expected: Cost increases 200x
// Task: Identify using LangSmith cost dashboard
// Solution: Switch back to gpt-4o-mini for simple tasks
```

**Tasks**:
1. Introduce each issue
2. Use LangSmith to diagnose
3. Document findings
4. Apply fix
5. Verify resolution

**Success Criteria**:
- [ ] Identified all 3 issues using LangSmith
- [ ] Documented root cause for each
- [ ] Applied fixes
- [ ] Metrics returned to normal

### Phase 5: Create Production Runbook (30 minutes)

**Task**: Document your production system

Create `RUNBOOK.md` with:

1. **System Overview**
   - Architecture diagram
   - Dependencies
   - Environment variables

2. **Deployment Process**
   - Build steps
   - Deployment command
   - Health check verification
   - Rollback procedure

3. **Monitoring**
   - Key metrics to watch
   - Alert thresholds
   - LangSmith dashboard links

4. **Common Issues**
   - Issue symptoms
   - Diagnosis steps
   - Resolution procedure
   - Prevention measures

5. **Emergency Contacts**
   - On-call rotation
   - Escalation path
   - Slack channels

**Example Template**:

```markdown
# AI-LangX Production Runbook

## System Overview
- **Service**: AI Backend (LangGraph + LangChain + LangSmith)
- **Port**: 3001
- **Dependencies**: OpenAI API, Backend API, LangSmith

## Deployment
```bash
# Build
docker build -t ai-langx:$(git rev-parse --short HEAD) .

# Deploy
kubectl set image deployment/ai-langx ai-langx=ai-langx:$(git rev-parse --short HEAD)

# Verify
kubectl rollout status deployment/ai-langx
curl https://api.example.com/health
```

## Monitoring
- **Dashboard**: https://smith.langchain.com/o/your-org/projects/p/ai-langx-prod
- **Key Metrics**:
  - Error rate < 1%
  - p95 latency < 3s
  - Cost < $50/day

## Common Issues

### Issue: "Rate limit exceeded"
**Symptoms**: 429 errors, users seeing "Too many requests"
**Diagnosis**: Check LangSmith for error count by user
**Resolution**: Increase rate limit or ask user to slow down
**Prevention**: Implement tier-based rate limiting

[... more issues ...]
```

### Challenge Completion Checklist

**Part 1: Local Production** ✅
- [ ] Production environment configured
- [ ] Monitoring enabled
- [ ] Load tested successfully

**Part 2: Docker Deployment** ✅
- [ ] Dockerfile created
- [ ] Container runs successfully
- [ ] Health checks working

**Part 3: Monitoring Dashboard** ✅
- [ ] Real-time dashboard implemented
- [ ] Alerts configured
- [ ] 15-minute monitoring complete

**Part 4: Troubleshooting** ✅
- [ ] All 3 issues diagnosed
- [ ] Fixes applied
- [ ] Resolution verified

**Part 5: Runbook** ✅
- [ ] RUNBOOK.md created
- [ ] All sections complete
- [ ] Reviewed by team

### Bonus Challenges

1. **CI/CD Pipeline**: Set up GitHub Actions for automated deployment
2. **Blue-Green Deployment**: Implement zero-downtime deployment
3. **Advanced Monitoring**: Add custom evaluators for quality tracking
4. **Cost Optimization**: Reduce cost per request by 50%
5. **Performance Tuning**: Achieve p95 latency < 1s

### Expected Time: 2.5 hours

### Key Learnings
- Production environment requires different configuration than dev
- Monitoring is essential for diagnosing issues
- LangSmith provides complete visibility into AI system
- Error handling and retries prevent cascading failures
- Documentation (runbook) speeds up incident response

**🎉 Congratulations! You've completed the Production Deployment Challenge!**

---

**End of Part 7: Integration & Production**

**You have now completed all 270+ concepts across LangChain, LangGraph, and LangSmith!** 🚀

---

## Navigation

- [← Back to Part 6: LangSmith](./PART_6_LANGSMITH.md)
- [← Back to Part 5: LangGraph](./PART_5_LANGGRAPH.md)  
- [← Back to Part 4: Advanced Patterns](./PART_4_ADVANCED_PATTERNS.md)
- [← Back to Part 3: RAG Deep Dive](./PART_3_RAG_DEEP_DIVE.md)
- [← Back to Part 2: LangChain Components](./PART_2_LANGCHAIN_COMPONENTS.md)
- [← Back to Part 1: Fundamentals](./PART_1_FUNDAMENTALS.md)
