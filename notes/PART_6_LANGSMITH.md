# Part 6: LangSmith
## Observability, Monitoring & Evaluation

**Prerequisites**: Complete Parts 1-5  
**Concepts Covered**: 40+  
**Reading Time**: 5-6 hours  
**Hands-On**: Set up production monitoring

---

## Table of Contents

33. [LangSmith Fundamentals](#chapter-33-langsmith-fundamentals)
34. [Automatic Tracing](#chapter-34-automatic-tracing)
35. [Tags & Metadata](#chapter-35-tags--metadata)
36. [Filtering & Searching Runs](#chapter-36-filtering--searching-runs)
37. [Trace Analysis](#chapter-37-trace-analysis)
38. [Feedback & Annotations](#chapter-38-feedback--annotations)
39. [Datasets & Testing](#chapter-39-datasets--testing)
40. [Experiments & A/B Testing](#chapter-40-experiments--ab-testing)
41. [Evaluators](#chapter-41-evaluators)
42. [Production Monitoring](#chapter-42-production-monitoring)

---

## Chapter 33: LangSmith Fundamentals

### 33.1 What Is LangSmith?

**LangSmith = Observability platform for LLM applications** (logging, debugging, monitoring)

Think of LangSmith as:
- 📊 **Application Performance Monitoring (APM)** for AI (like DataDog, New Relic)
- 🔍 **Debugging Tool**: See exactly what LLM received/returned
- 📈 **Analytics Dashboard**: Track costs, latency, error rates
- ✅ **Testing Framework**: Datasets, experiments, evaluations

### 33.2 Why LangSmith?

**Problems without LangSmith**:

```javascript
// ❌ No visibility
const result = await agent.invoke({ input: "create expense" });
// What happened inside?
// - Which tools were called?
// - What did the LLM see?
// - How much did it cost?
// - How long did each step take?
// - Why did it fail?
```

**Solutions with LangSmith**:

```javascript
// ✅ Full visibility (automatic)
const result = await agent.invoke({ input: "create expense" });

// LangSmith dashboard shows:
// - Complete trace tree (agent → LLM → tool → LLM)
// - Inputs/outputs at each step
// - Token counts, costs ($0.0045)
// - Latency per step (LLM: 1.2s, tool: 0.3s)
// - Error details if failed
```

### 33.3 Core Concepts

#### **1. Trace = Complete execution path**

```
Trace: "Create Expense"
├─ Agent (1.5s, $0.0050)
│  ├─ LLM Call 1 (0.8s, $0.0020)
│  ├─ Tool: CreateExpenseTool (0.3s, $0)
│  └─ LLM Call 2 (0.4s, $0.0030)
└─ Final Output
```

#### **2. Run = Single LLM/Chain/Tool call**

Each box in the trace tree is a "run":
- **Chain run**: Entire agent execution
- **LLM run**: Single LLM API call
- **Tool run**: Single tool execution
- **Retriever run**: RAG retrieval

#### **3. Project = Grouping of traces**

```
Projects:
├─ expense-tracker-dev (development traces)
├─ expense-tracker-staging
└─ expense-tracker-prod (production traces)
```

### 33.4 Setup

#### **1. Get API Key**

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up / Log in
3. Settings → Create API Key

#### **2. Environment Variables**

```bash
# .env file
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=ai-expense-tracker-dev  # Optional (defaults to "default")
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com  # Optional (default)
```

```javascript
// Load in Node.js
import 'dotenv/config';

// Or set programmatically
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_API_KEY = "lsv2_pt_...";
process.env.LANGCHAIN_PROJECT = "ai-expense-tracker-dev";
```

#### **3. That's It! (Automatic Tracing)**

```javascript
// No code changes needed!
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const result = await llm.invoke("Hello");

// ✅ Automatically traced to LangSmith dashboard
```

### 33.5 LangSmith Dashboard Overview

**Navigate to**: smith.langchain.com → Your Project

#### **Projects View**

```
┌────────────────────────────────────────────────────┐
│ Project: ai-expense-tracker-prod                   │
├────────────────────────────────────────────────────┤
│ Total Runs: 12,453                                 │
│ Success Rate: 94.2%                                │
│ Avg Latency: 1.8s                                  │
│ Total Cost: $234.56                                │
└────────────────────────────────────────────────────┘
```

#### **Runs View** (List of all traces)

```
┌──────────────────────────────────────────────────────────────┐
│ Name              Status   Latency   Cost    Timestamp       │
├──────────────────────────────────────────────────────────────┤
│ Agent (expense)   ✓       1.2s      $0.005  2m ago           │
│ RAG Q&A           ✓       2.4s      $0.012  5m ago           │
│ Agent (expense)   ✗       0.8s      $0.003  10m ago  [Error] │
│ Classification    ✓       0.5s      $0.001  15m ago          │
└──────────────────────────────────────────────────────────────┘
```

#### **Trace View** (Drill into single trace)

```
Trace: Agent (expense creation)
Total: 1.5s, $0.0045

└─ AgentExecutor (1.5s, $0.0045)
   ├─ Input: "Add 500 for lunch"
   ├─ LLM (gpt-4o-mini) (0.8s, $0.0020)
   │  ├─ Input: System prompt + user message + tools
   │  ├─ Output: tool_calls = [{ name: "CreateExpenseTool", ... }]
   │  ├─ Tokens: 450 prompt, 120 completion
   │  └─ Cost: $0.0020
   ├─ Tool: CreateExpenseTool (0.3s, $0)
   │  ├─ Input: { amount: 500, category: "Food", ... }
   │  ├─ API Call: POST /api/expenses
   │  └─ Output: { success: true, expenseId: 123 }
   ├─ LLM (gpt-4o-mini) (0.4s, $0.0025)
   │  ├─ Input: Previous messages + tool result
   │  ├─ Output: "✅ Expense created: Lunch - ₹500"
   │  └─ Tokens: 520 prompt, 30 completion
   └─ Final Output: "✅ Expense created: Lunch - ₹500"
```

### 33.6 Real Example: ai-langx/ with LangSmith

```javascript
// File: src/config/langsmith.config.js

// Already set up via .env, but you can customize per request

export const getTraceTags = (feature, userId) => {
  return [
    process.env.NODE_ENV || "development",  // "production" | "development"
    feature,  // "transactional" | "qa" | "reconciliation"
    `user-${userId}`
  ];
};

export const getTraceMetadata = (traceId, userId, extra = {}) => {
  return {
    traceId,
    userId,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    ...extra
  };
};
```

```javascript
// File: src/handlers/ragQaHandler.js

import { ChatOpenAI } from "@langchain/openai";
import { getTraceTags, getTraceMetadata } from "../config/langsmith.config.js";

export const ragQaHandler = async (state, config) => {
  const { userMessage } = state;
  const { userId, traceId } = config.configurable;
  
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    
    // LangSmith configuration
    tags: getTraceTags("qa", userId),
    metadata: getTraceMetadata(traceId, userId, {
      feature: "rag-qa",
      handler: "ragQaHandler"
    })
  });
  
  // ... RAG execution
  
  const response = await llm.invoke(prompt);
  
  return { finalResponse: response.content };
};

// Usage
const result = await intentRouterGraph.invoke(
  { userMessage: "What's the meal policy?" },
  {
    configurable: {
      userId: 456,
      authToken: "...",
      traceId: generateTraceId()
    }
  }
);

// LangSmith dashboard shows:
// - Tags: ["production", "qa", "user-456"]
// - Metadata: { traceId: "...", userId: 456, feature: "rag-qa", ... }
```

### 33.7 Viewing Traces in Dashboard

1. **Go to Project**: smith.langchain.com → ai-expense-tracker-prod
2. **Click on Trace**: See full execution tree
3. **Inspect Runs**: Click any LLM/Tool run to see:
   - Full input prompt
   - Complete output
   - Token breakdown
   - Exact cost
   - Timing information
4. **Debug Errors**: Click failed runs to see stack trace

**✅ You now understand LangSmith Fundamentals!**

---

## Chapter 34: Automatic Tracing

### 34.1 What Gets Traced Automatically?

**All LangChain primitives are auto-traced**:

- ✅ **LLMs**: `ChatOpenAI`, `ChatAnthropic`, etc.
- ✅ **Chains**: `LLMChain`, `RetrievalQAChain`, LCEL chains
- ✅ **Agents**: `AgentExecutor`, agent loops
- ✅ **Tools**: Any tool called by agent
- ✅ **Retrievers**: Vector store searches
- ✅ **Document Loaders**: PDF loading, text splitting
- ✅ **Embeddings**: Embedding generation
- ✅ **LangGraph**: Entire graph execution + each node

### 34.2 LLM Tracing

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

const response = await llm.invoke("What is 2+2?");

// LangSmith trace:
// ChatOpenAI (0.5s, $0.0001)
// ├─ Input: [{ role: "user", content: "What is 2+2?" }]
// ├─ Output: "2 + 2 equals 4."
// ├─ Tokens: 12 prompt, 8 completion
// └─ Cost: $0.0001
```

### 34.3 Chain Tracing

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

const prompt = PromptTemplate.fromTemplate(
  "Categorize this expense: {description}"
);

const chain = prompt.pipe(llm);

const result = await chain.invoke({ description: "Coffee at Starbucks" });

// LangSmith trace:
// RunnableSequence (0.6s, $0.0002)
// ├─ PromptTemplate (0.001s, $0)
// │  ├─ Input: { description: "Coffee at Starbucks" }
// │  └─ Output: "Categorize this expense: Coffee at Starbucks"
// └─ ChatOpenAI (0.599s, $0.0002)
//    ├─ Input: "Categorize this expense: Coffee at Starbucks"
//    ├─ Output: "Food & Beverages"
//    └─ Cost: $0.0002
```

### 34.4 Agent Tracing

```javascript
import { AgentExecutor } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { CreateExpenseTool } from "./tools/createExpense.tool.js";

const tools = [new CreateExpenseTool(authToken, { userId })];
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

const agent = new AgentExecutor({ llm, tools });

const result = await agent.invoke({
  input: "Add 500 for lunch"
});

// LangSmith trace (hierarchical):
// AgentExecutor (1.2s, $0.0045)
// ├─ Input: "Add 500 for lunch"
// ├─ LLM Call 1 - Planning (0.8s, $0.0020)
// │  ├─ Input: System + User message + Tool schemas
// │  ├─ Reasoning: "User wants to create expense..."
// │  └─ Output: tool_calls = [{ name: "CreateExpenseTool", args: {...} }]
// ├─ Tool: CreateExpenseTool (0.3s, $0)
// │  ├─ Input: { amount: 500, category: "Food", description: "Lunch" }
// │  └─ Output: "{"success": true, "expenseId": 123}"
// ├─ LLM Call 2 - Final Answer (0.4s, $0.0025)
// │  ├─ Input: Previous + Tool result
// │  └─ Output: "✅ Created expense: Lunch - ₹500"
// └─ Final Output: "✅ Created expense: Lunch - ₹500"
```

**What you see in dashboard**:
- **Timeline view**: See which step took longest
- **Token breakdown**: Prompt vs completion tokens per call
- **Cost attribution**: Exact cost per LLM call
- **Error location**: If failure, see exactly which step failed

### 34.5 RAG Tracing

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";

const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromTexts(
  ["Policy: Meal limit is ₹500", "Policy: Travel by train preferred"],
  [{ source: "policy" }, { source: "policy" }],
  embeddings
);

const retriever = vectorStore.asRetriever();
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

const chain = RetrievalQAChain.fromLLM(llm, retriever);

const result = await chain.invoke({
  query: "What's the meal limit?"
});

// LangSmith trace:
// RetrievalQAChain (1.5s, $0.0030)
// ├─ Input: "What's the meal limit?"
// ├─ Retriever (0.3s, $0.0005)
// │  ├─ Query: "What's the meal limit?"
// │  ├─ Embedding: OpenAIEmbeddings (0.2s, $0.0005)
// │  ├─ Vector Search: Similarity search in vector store
// │  └─ Output: [{ text: "Policy: Meal limit is ₹500", score: 0.92 }]
// ├─ LLM (gpt-4o-mini) (1.2s, $0.0025)
// │  ├─ Input: Question + Retrieved context
// │  ├─ Reasoning: Use context to answer
// │  └─ Output: "The meal limit is ₹500 per meal."
// └─ Final Output: "The meal limit is ₹500 per meal."
```

**Benefits**:
- See exactly what documents were retrieved
- Check relevance scores
- Verify LLM received correct context
- Debug "hallucination" (LLM ignored context)

### 34.6 LangGraph Tracing

```javascript
import { StateGraph } from "@langchain/langgraph";

const graph = new StateGraph(StateAnnotation);
graph.addNode("step1", step1Node);
graph.addNode("step2", step2Node);
// ... build graph

const workflow = graph.compile();

const result = await workflow.invoke({ input: "hello" });

// LangSmith trace:
// StateGraph (2.0s, $0.0050)
// ├─ Input: { input: "hello" }
// ├─ Node: step1 (1.0s, $0.0020)
// │  ├─ Input State: { input: "hello" }
// │  ├─ LLM Call (0.8s, $0.0020)
// │  └─ Output State: { input: "hello", result1: "..." }
// ├─ Node: step2 (1.0s, $0.0030)
// │  ├─ Input State: { input: "hello", result1: "..." }
// │  ├─ LLM Call (0.9s, $0.0030)
// │  └─ Output State: { input: "hello", result1: "...", result2: "..." }
// └─ Final State: { input: "hello", result1: "...", result2: "..." }
```

### 34.7 Nested Tracing

**Traces show full call hierarchy**:

```
Agent
└─ LLM (planning)
   └─ (internal tokenization, API call)
└─ Tool: RAGTool
   └─ RAG Chain
      ├─ Retriever
      │  └─ Embeddings
      │     └─ OpenAI Embeddings API
      └─ LLM (answer generation)
         └─ (internal tokenization, API call)
└─ LLM (final answer)
```

### 34.8 Disabling Tracing (Temporarily)

```javascript
// Method 1: Environment variable
process.env.LANGCHAIN_TRACING_V2 = "false";

// Method 2: Per-call
const result = await llm.invoke("Hello", {
  runName: "my-run",
  tags: ["no-trace"]
});

// Method 3: Context manager (Python-style, not available in JS)
// In JS, just set env var before call, restore after
const prevTracing = process.env.LANGCHAIN_TRACING_V2;
process.env.LANGCHAIN_TRACING_V2 = "false";

await llm.invoke("Hello");  // Not traced

process.env.LANGCHAIN_TRACING_V2 = prevTracing;  // Restore
```

**✅ You now understand Automatic Tracing!**

---

## Chapter 35: Tags & Metadata

### 35.1 What Are Tags & Metadata?

**Tags = Labels for filtering** (e.g., "production", "user-123")  
**Metadata = Key-value data** (e.g., `{ userId: 123, feature: "expense" }`)

Use cases:
- 🎯 **Filtering**: Find all traces for specific user
- 📊 **Grouping**: Analyze by feature, environment, version
- 🐛 **Debugging**: Filter to specific error type
- 💰 **Cost Tracking**: Track costs per user/feature

### 35.2 Adding Tags

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  tags: ["production", "feature-expense", "user-456"]
});

const result = await llm.invoke("Hello");

// LangSmith: Trace tagged with ["production", "feature-expense", "user-456"]
```

#### **Dynamic Tags**

```javascript
const getTags = (userId, feature, environment) => {
  return [
    environment,  // "production" | "staging" | "development"
    `feature-${feature}`,  // "feature-expense" | "feature-qa"
    `user-${userId}`,  // "user-123"
    process.env.npm_package_version || "v1.0.0"  // "v1.2.3"
  ];
};

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  tags: getTags(456, "expense", "production")
});
```

### 35.3 Adding Metadata

```javascript
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  metadata: {
    userId: 456,
    feature: "expense-creation",
    sessionId: "session-789",
    clientVersion: "2.1.0",
    platform: "web"
  }
});

const result = await llm.invoke("Create expense");

// LangSmith: Metadata attached to trace
```

### 35.4 Tags & Metadata in Chains

```javascript
const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke(
  { input: "..." },
  {
    tags: ["production", "chain-execution"],
    metadata: { userId: 456, traceId: "trace-123" }
  }
);
```

### 35.5 Tags & Metadata in Agents

```javascript
const agent = new AgentExecutor({ llm, tools });

const result = await agent.invoke(
  { input: "Add expense" },
  {
    tags: ["agent", "expense"],
    metadata: {
      userId: 456,
      intent: "transactional"
    }
  }
);
```

### 35.6 Tags & Metadata in LangGraph

```javascript
const workflow = graph.compile();

const result = await workflow.invoke(
  { userMessage: "Hello" },
  {
    configurable: {
      thread_id: "thread-123",
      userId: 456
    },
    tags: ["graph-execution", "intent-router"],
    metadata: {
      feature: "intent-classification",
      version: "2.0.0"
    }
  }
);
```

### 35.7 Real Example: ai-langx/ Tagging Strategy

```javascript
// File: src/config/langsmith.config.js

export const getTraceTags = (feature, userId) => {
  const environment = process.env.NODE_ENV || "development";
  const version = process.env.npm_package_version || "1.0.0";
  
  return [
    environment,  // "production" | "staging" | "development"
    `feature-${feature}`,  // "feature-transactional" | "feature-qa"
    `user-${userId}`,  // "user-456"
    `v${version}`  // "v1.2.3"
  ];
};

export const getTraceMetadata = (traceId, userId, extra = {}) => {
  return {
    traceId,
    userId,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    ...extra
  };
};
```

```javascript
// File: src/handlers/transactionalHandler.js

import { getTraceTags, getTraceMetadata } from "../config/langsmith.config.js";

export const transactionalHandler = async (state, config) => {
  const { userId, traceId } = config.configurable;
  
  const agent = new AgentExecutor({
    llm: new ChatOpenAI({
      modelName: "gpt-4o-mini",
      tags: getTraceTags("transactional", userId),
      metadata: getTraceMetadata(traceId, userId, {
        handler: "transactionalHandler",
        intent: state.intent
      })
    }),
    tools: [createExpenseTool, deleteExpenseTool, listExpensesTool]
  });
  
  const result = await agent.invoke({
    input: state.userMessage
  });
  
  return { finalResponse: result.output };
};
```

**Dashboard filtering**:
- All production traces: `environment:production`
- All transactional features: `feature-transactional`
- All traces for user 456: `user-456`
- All traces for version 1.2.3: `v1.2.3`

### 35.8 Filtering Runs by Tags

**In LangSmith dashboard**:

1. **Go to Project** → Runs
2. **Filter bar** → Add filters:
   - `tags:production`
   - `tags:user-456`
   - `tags:feature-expense`
3. **Combine filters** (AND logic):
   - `tags:production AND tags:user-456`
4. **Save filter** for quick access

### 35.9 Filtering Runs by Metadata

**In LangSmith dashboard**:

1. **Go to Project** → Runs
2. **Filter bar** → Metadata filters:
   - `metadata.userId = 456`
   - `metadata.feature = "expense-creation"`
   - `metadata.version = "1.2.3"`
3. **Numeric comparisons**:
   - `metadata.cost > 0.01`
   - `metadata.latency_ms > 2000`

### 35.10 Best Practices

#### **1. Consistent Tag Naming**

```javascript
// ✅ Good: Consistent format
tags: ["production", "feature-expense", "user-456"]

// ❌ Bad: Inconsistent
tags: ["PROD", "expense_feature", "userId:456"]
```

#### **2. Use Both Tags & Metadata**

```javascript
// Tags: For filtering/grouping (strings)
tags: ["production", "feature-expense", "user-456"]

// Metadata: For detailed context (any type)
metadata: {
  userId: 456,  // Number
  cost: 0.0045,  // Float
  tokens: 520,  // Integer
  timestamp: "2026-02-09T15:30:00Z",  // ISO string
  feature: "expense-creation"  // String
}
```

#### **3. Don't Overdo Tags**

```javascript
// ✅ Good: 3-5 meaningful tags
tags: ["production", "feature-expense", "user-456"]

// ❌ Bad: Too many tags (hard to filter)
tags: [
  "production", "expense", "create", "web", "chrome",
  "mobile", "ios", "version-1-2-3", "friday", "daytime", ...
]
```

**✅ You now understand Tags & Metadata!**

---

## Chapter 36: Filtering & Searching Runs

### 36.1 Filter Bar in LangSmith

**LangSmith dashboard** → Project → Runs → **Filter Bar**

### 36.2 Filter by Status

```
Filter: status = "success"
Filter: status = "error"
```

**Use cases**:
- Find all failed runs → Debug errors
- Check success rate → Monitor reliability

### 36.3 Filter by Tags

```
Filter: tags:"production"
Filter: tags:"user-456"
Filter: tags:"feature-expense" AND tags:"production"
```

### 36.4 Filter by Metadata

```
Filter: metadata.userId = 456
Filter: metadata.feature = "expense-creation"
Filter: metadata.cost > 0.01  (runs costing more than $0.01)
Filter: metadata.latency_ms > 2000  (runs taking > 2 seconds)
```

### 36.5 Filter by Time Range

```
Filter: timestamp > "2026-02-09T00:00:00Z"
Filter: timestamp between "2026-02-09" and "2026-02-10"
```

**Use cases**:
- Analyze specific time period
- Compare before/after deployment
- Find issues during outage window

### 36.6 Filter by Cost

```
Filter: cost > 0.01  (expensive runs)
Filter: cost < 0.001  (cheap runs)
```

### 36.7 Filter by Latency

```
Filter: latency > 2000  (slow runs, ms)
Filter: latency < 500  (fast runs)
```

### 36.8 Filter by Tokens

```
Filter: prompt_tokens > 1000
Filter: completion_tokens > 500
Filter: total_tokens > 2000
```

### 36.9 Text Search

**Search in inputs/outputs**:

```
Search: "expense"  (finds traces with "expense" in input or output)
Search: "error"  (finds error messages)
Search: "₹500"  (finds specific amounts)
```

### 36.10 Combine Filters

**AND logic** (all conditions must match):

```
Filter: tags:"production" AND status:"error" AND metadata.userId = 456
// Find all production errors for user 456
```

```
Filter: cost > 0.01 AND latency > 2000
// Find expensive AND slow runs
```

### 36.11 Save Filters

**Create saved views** for common queries:

1. **Apply filters**: e.g., `tags:"production" AND status:"error"`
2. **Click "Save Filter"**
3. **Name it**: "Production Errors"
4. **Quick access**: Dropdown → "Production Errors"

**Common saved filters**:
- "Production Errors": `tags:"production" AND status:"error"`
- "Expensive Runs": `cost > 0.01`
- "Slow Runs": `latency > 3000`
- "User 456 Traces": `metadata.userId = 456`
- "Today's Transactional": `tags:"feature-transactional" AND timestamp > "today"`

### 36.12 Real Example: Finding Issues

#### **Scenario 1: User reports error**

```
User 456: "I got an error creating expense at 3:15 PM"

Filters:
- metadata.userId = 456
- status = "error"
- timestamp between "2026-02-09T15:00" and "2026-02-09T15:30"

Result: 1 trace found
└─ Error: "Invalid category: Foood" (typo in input)
```

#### **Scenario 2: Find expensive operations**

```
Goal: Identify which features cost the most

Filters:
- tags:"production"
- cost > 0.01
- timestamp > "last 7 days"

Group by: metadata.feature

Result:
- feature-reconciliation: $12.34 (120 runs, avg $0.103)
- feature-transactional: $5.67 (850 runs, avg $0.007)
- feature-qa: $3.45 (450 runs, avg $0.008)

Action: Optimize reconciliation (using expensive model, switch to cheaper)
```

#### **Scenario 3: Monitor deployment**

```
Goal: Check new version for errors

Before deployment (v1.2.2):
Filters: tags:"v1.2.2" AND status:"error"
Result: 5 errors / 1000 runs = 0.5% error rate

After deployment (v1.2.3):
Filters: tags:"v1.2.3" AND status:"error"
Result: 2 errors / 500 runs = 0.4% error rate ✅

Conclusion: Deployment successful (error rate decreased)
```

**✅ You now understand Filtering & Searching!**

---

## Chapter 37: Trace Analysis

### 37.1 Trace Timeline View

**Click on any trace** → See timeline visualization

```
Timeline (Total: 1.8s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤

├─ LLM 1 ━━━━━━━━━━━━━━━━━━━┤ 0.8s (44%)
├─ Tool  ─────┤ 0.3s (17%)
├─ LLM 2 ━━━━━━━━━┤ 0.5s (28%)
└─ Other ──┤ 0.2s (11%)
```

**Insights**:
- LLM calls take 72% of time → Consider caching
- Tool execution is fast (17%) → Not a bottleneck
- First LLM call is slowest → Optimize prompt length

### 37.2 Drilling Into LLM Calls

**Click on LLM run** → See details:

#### **Input Tab**

```
Messages:
[
  {
    "role": "system",
    "content": "You are an expense management assistant..."
  },
  {
    "role": "user",
    "content": "Add 500 for lunch"
  }
]

Tools:
[
  {
    "name": "CreateExpenseTool",
    "description": "Create a new expense...",
    "parameters": { "type": "object", "properties": {...} }
  }
]
```

#### **Output Tab**

```
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "CreateExpenseTool",
        "arguments": "{\"amount\":500,\"category\":\"Food\",\"description\":\"Lunch\"}"
      }
    }
  ]
}
```

#### **Metadata Tab**

```
Model: gpt-4o-mini
Temperature: 0
Max Tokens: 2000

Tokens:
- Prompt: 450 tokens
- Completion: 35 tokens
- Total: 485 tokens

Cost: $0.0024

Latency: 823ms

API Response Headers:
- x-ratelimit-remaining: 9850
- x-ratelimit-reset: 60s
```

### 37.3 Analyzing Tool Calls

**Click on Tool run** → See tool execution:

```
Tool: CreateExpenseTool

Input:
{
  "amount": 500,
  "category": "Food",
  "description": "Lunch"
}

Execution:
├─ Validation: amount > 0 ✓
├─ API Call: POST /api/expenses
│  Headers: { Authorization: "Bearer ..." }
│  Body: { amount: 500, category: "Food", ... }
├─ Response: 201 Created
└─ Result: { success: true, expenseId: 123 }

Output:
"{\"success\": true, \"expenseId\": 123, \"message\": \"Expense created\"}"

Latency: 287ms
```

### 37.4 Analyzing Retrieval

**RAG traces show retrieval details**:

```
Retriever Run

Query: "What's the meal policy?"

Embedding Generation:
├─ Model: text-embedding-3-small
├─ Input: "What's the meal policy?"
├─ Output: [0.123, -0.456, ...] (1536 dimensions)
└─ Cost: $0.00002

Vector Search:
├─ Method: Similarity (Cosine)
├─ Top K: 4
└─ Results:
   1. Score: 0.92 - "Meal reimbursement limit is ₹500 per meal..."
   2. Score: 0.87 - "Receipts required for meals above ₹200..."
   3. Score: 0.81 - "Breakfast limit: ₹150, Lunch: ₹500, Dinner: ₹500..."
   4. Score: 0.76 - "Alcohol not reimbursed under meal policy..."

Retrieved Documents:
[
  {
    "text": "Meal reimbursement limit is ₹500 per meal...",
    "metadata": { "source": "policies/expense-policy.pdf", "page": 3 },
    "score": 0.92
  },
  ...
]
```

**Debugging poor retrieval**:
- ❌ Low scores (< 0.7) → Query-document mismatch
- ❌ Wrong documents retrieved → Need better chunking
- ❌ Documents missing key info → Incomplete knowledge base

### 37.5 Error Traces

**Failed runs show error details**:

```
Status: ERROR ❌

Error Type: OpenAIError
Error Message: "Rate limit exceeded. Retry after 45s."

Stack Trace:
  at ChatOpenAI.invoke (node_modules/@langchain/openai/chat.js:45)
  at AgentExecutor.run (node_modules/langchain/agents/executor.js:120)
  at transactionalHandler (src/handlers/transactionalHandler.js:25)

Error Data:
{
  "status": 429,
  "headers": {
    "x-ratelimit-remaining": "0",
    "retry-after": "45"
  }
}

Occurred At: 15:30:45 (Step 2 of 4)

Partial Output:
├─ Step 1: Classification ✓
├─ Step 2: LLM Call ❌ (Error here)
└─ Steps 3-4: Not executed
```

### 37.6 Comparing Traces

**Compare 2 traces side-by-side**:

```
Select 2 traces → Click "Compare"

┌─────────────────────────────────────────────────────────────┐
│ Trace A (Success)         │  Trace B (Failed)               │
├───────────────────────────┼─────────────────────────────────┤
│ Total: 1.2s, $0.005       │  Total: 0.8s, $0.003            │
│                           │                                 │
│ LLM 1: "gpt-4o-mini"      │  LLM 1: "gpt-4o-mini"           │
│ ├─ Prompt: 450 tokens     │  ├─ Prompt: 450 tokens          │
│ ├─ Completion: 35 tokens  │  ├─ Completion: 0 tokens        │
│ └─ Output: Tool call ✓    │  └─ Error: Rate limit ❌        │
│                           │                                 │
│ Tool: CreateExpense       │  (Not executed)                 │
│ └─ Result: Success ✓      │                                 │
└───────────────────────────┴─────────────────────────────────┘

Difference:
- Trace B hit rate limit → Solution: Add retry logic
```

### 37.7 Token Usage Breakdown

**Identify token-heavy operations**:

```
Trace: Agent Execution
Total Tokens: 1,245

Breakdown:
├─ LLM Call 1: 485 tokens (39%)
│  ├─ System Prompt: 180 tokens
│  ├─ User Message: 12 tokens
│  ├─ Tool Schemas: 220 tokens ← HEAVY!
│  └─ Completion: 73 tokens
├─ LLM Call 2: 560 tokens (45%)
│  ├─ Previous Messages: 485 tokens
│  ├─ Tool Result: 45 tokens
│  └─ Completion: 30 tokens
└─ LLM Call 3: 200 tokens (16%)

Optimization Opportunities:
- Tool schemas: 220 tokens → Use smaller descriptions
- System prompt: 180 tokens → Can we shorten?
```

### 37.8 Cost Analysis per Trace

```
Trace Cost Breakdown:
Total: $0.0062

├─ LLM Calls: $0.0060 (97%)
│  ├─ gpt-4o-mini (Call 1): $0.0024
│  ├─ gpt-4o-mini (Call 2): $0.0028
│  └─ gpt-4o-mini (Call 3): $0.0008
├─ Embeddings: $0.0002 (3%)
│  └─ text-embedding-3-small: $0.0002
└─ Tools: $0.0000 (0%)

Per 1000 Runs: $6.20
Per Month (100k runs): $620
```

### 37.9 Latency Breakdown

```
Latency Analysis:
Total: 1,850ms

├─ LLM Calls: 1,500ms (81%)
│  ├─ LLM 1: 650ms (35%)
│  ├─ LLM 2: 580ms (31%)
│  └─ LLM 3: 270ms (15%)
├─ Tool Execution: 280ms (15%)
│  ├─ API Call: 250ms
│  └─ Validation: 30ms
├─ Retrieval: 50ms (3%)
│  ├─ Embedding: 30ms
│  └─ Vector Search: 20ms
└─ Other: 20ms (1%)

Optimization:
- LLM calls dominate → Consider caching frequent queries
- Tool API call: 250ms → Acceptable (backend latency)
```

### 37.10 Real Example: Debugging Slow Trace

```
Issue: User complains "AI is slow"

Step 1: Filter traces
- Filter: metadata.userId = 456 AND latency > 2000

Step 2: Found slow trace (3.2s)
- Click trace → Timeline view

Step 3: Identify bottleneck
Timeline:
├─ LLM Call 1: 2.8s ← BOTTLENECK! (87% of time)
├─ Tool Call: 0.3s
└─ LLM Call 2: 0.1s

Step 4: Investigate LLM Call 1
- Prompt tokens: 3,500 ← Very long!
- Problem: System prompt includes entire policy document

Step 5: Fix
Before: System prompt = 3,000 tokens (entire policy)
After: System prompt = 500 tokens (summary + RAG for details)

Result: Latency reduced to 1.1s ✅
```

**✅ You now understand Trace Analysis!**

---

## Chapter 38: Feedback & Annotations

### 38.1 What Is Feedback?

**Feedback = Human evaluation of AI responses** (thumbs up/down, scores, comments)

Use cases:
- 📊 **Quality Monitoring**: Track user satisfaction
- 🐛 **Error Detection**: Find bad responses
- 📈 **Model Improvement**: Create training data
- ✅ **A/B Testing**: Compare model performance

### 38.2 Feedback Types

#### **1. Thumbs Up/Down** (Binary)

```
User sees response → Clicks 👍 or 👎
```

#### **2. Score** (Numeric)

```
User rates response: 1-5 stars
```

#### **3. Comment** (Text)

```
User provides explanation: "Response was incorrect because..."
```

#### **4. Correction** (Expected Output)

```
User provides what response should have been
```

### 38.3 Adding Feedback via API

```javascript
// File: src/routes/feedback.js

import express from 'express';
import { Client } from 'langsmith';

const router = express.Router();
const langsmithClient = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY
});

// POST /ai/feedback
router.post('/', async (req, res) => {
  const { runId, score, comment, correction } = req.body;
  
  try {
    // Create feedback
    await langsmithClient.createFeedback(runId, {
      key: "user-feedback",  // Feedback type
      score: score,  // 0 (bad) to 1 (good), or null
      comment: comment,  // Optional text
      correction: correction  // Optional expected output
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 38.4 Capturing Feedback in Frontend

```typescript
// Frontend: src/app/services/ai.service.ts

import { HttpClient } from '@angular/common/http';

export class AIService {
  submitFeedback(runId: string, thumbsUp: boolean, comment?: string) {
    return this.http.post('/ai/feedback', {
      runId,
      score: thumbsUp ? 1.0 : 0.0,
      comment
    });
  }
}
```

```typescript
// Frontend: src/app/components/chat/chat.component.ts

// User clicks thumbs up
onThumbsUp(message: ChatMessage) {
  this.aiService.submitFeedback(message.runId, true).subscribe(() => {
    message.feedbackSubmitted = true;
  });
}

// User clicks thumbs down with comment
onThumbsDown(message: ChatMessage) {
  const comment = prompt("What was wrong with this response?");
  if (comment) {
    this.aiService.submitFeedback(message.runId, false, comment).subscribe(() => {
      message.feedbackSubmitted = true;
    });
  }
}
```

### 38.5 Getting Run ID for Feedback

```javascript
// Backend: Return run ID with response

import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// Get run ID from callback
let runId = null;

const result = await llm.invoke(
  "What's the meal policy?",
  {
    callbacks: [{
      handleLLMEnd: (output, runId_) => {
        runId = runId_;
      }
    }]
  }
);

// Return to frontend
res.json({
  answer: result.content,
  runId: runId  // Frontend uses this for feedback
});
```

### 38.6 Viewing Feedback in Dashboard

**LangSmith Dashboard** → Trace → **Feedback Tab**

```
Feedback:
├─ user-feedback (Score: 0.0) 👎
│  ├─ Comment: "Response was wrong, meal limit is ₹500 not ₹300"
│  └─ Created: 2026-02-09 15:35:00
└─ correction (Expected Output)
   └─ "The meal limit is ₹500 per meal as of 2026."
```

### 38.7 Filtering by Feedback

```
Filter: feedback.score < 0.5  (bad responses)
Filter: feedback.score > 0.8  (good responses)
Filter: has_feedback = true  (any feedback)
Filter: has_feedback = false  (no feedback yet)
```

**Use case**:
Find all negatively-rated responses → Review for patterns → Fix issues

### 38.8 Annotations (Internal Feedback)

**Annotations = Team member reviews** (developers, QA, domain experts)

```javascript
// Developer reviews trace in dashboard
// Clicks "Add Annotation"
// Adds note: "Hallucination - LLM ignored retrieved context"
// Tags: ["hallucination", "needs-prompt-fix"]
```

**Annotations vs Feedback**:
- **Feedback**: From end users (production)
- **Annotations**: From team (development/QA)

### 38.9 Real Example: Feedback Loop

```
Week 1: Launch feature
- Deploy AI expense assistant
- 1,000 interactions
- No feedback mechanism

Week 2: Add feedback
- Add thumbs up/down buttons
- Collect 500 feedback responses
- Results:
  - 👍 400 (80%)
  - 👎 100 (20%)

Week 3: Analyze negative feedback
- Filter: feedback.score = 0.0
- Review 100 negative responses
- Patterns found:
  1. 40% - Wrong category classification
  2. 30% - Didn't understand Indian food names
  3. 20% - Incorrect policy information
  4. 10% - Other

Week 4: Fix issues
- Issue 1: Improve few-shot examples with Indian expenses
- Issue 2: Add Indian food knowledge to system prompt
- Issue 3: Update RAG knowledge base with latest policies

Week 5: Measure improvement
- Deploy fixes
- Collect 500 new feedback responses
- Results:
  - 👍 450 (90%) ← Improved from 80%!
  - 👎 50 (10%)
```

### 38.10 Feedback Best Practices

#### **1. Make Feedback Easy**

```typescript
// ✅ Good: One-click feedback
<button (click)="onThumbsUp()">👍</button>
<button (click)="onThumbsDown()">👎</button>

// ❌ Bad: Require explanation every time
<button (click)="showFeedbackForm()">Rate Response</button>
// (Opens complex form with 10 fields)
```

#### **2. Optional Comments**

```typescript
// ✅ Good: Quick thumbs down, optional comment
onThumbsDown() {
  this.submitFeedback(0.0);  // Submit immediately
  
  // Optional: Ask for details
  const comment = prompt("(Optional) What was wrong?");
  if (comment) {
    this.updateFeedback(comment);
  }
}
```

#### **3. Show Feedback Confirmation**

```typescript
// ✅ Good: User knows feedback was received
onThumbsUp() {
  this.submitFeedback(1.0).subscribe(() => {
    this.showToast("Thanks for your feedback!"); ✓
  });
}
```

**✅ You now understand Feedback & Annotations!**

---

## Chapter 39: Datasets & Testing

### 39.1 What Are Datasets?

**Dataset = Collection of test cases** (inputs + expected outputs)

Use cases:
- ✅ **Regression Testing**: Verify prompt changes don't break existing functionality
- 📊 **Benchmarking**: Compare model performance (GPT-4 vs GPT-3.5)
- 🔄 **Continuous Evaluation**: Run tests on every deployment
- 📚 **Golden Set**: Curated examples for model evaluation

### 39.2 Creating a Dataset

**Method 1: Via Dashboard**

1. **LangSmith Dashboard** → Datasets → **Create Dataset**
2. **Name**: "expense-creation-test-cases"
3. **Add Examples**:
   - Input: "Add 500 for lunch"
   - Expected Output: `{"amount": 500, "category": "Food", "description": "Lunch"}`
4. **Save**

**Method 2: Via API**

```javascript
// File: scripts/createDataset.js

import { Client } from 'langsmith';

const client = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY
});

// Create dataset
const dataset = await client.createDataset("expense-creation-test-cases", {
  description: "Test cases for expense creation feature"
});

// Add examples
await client.createExample(
  dataset.id,
  {
    input: { userMessage: "Add 500 for lunch" },
    output: {
      description: "Lunch",
      amount: 500,
      category: "Food"
    }
  }
);

await client.createExample(
  dataset.id,
  {
    input: { userMessage: "Spent 2000 on taxi to airport" },
    output: {
      description: "Taxi to airport",
      amount: 2000,
      category: "Transport"
    }
  }
);

await client.createExample(
  dataset.id,
  {
    input: { userMessage: "Coffee at Starbucks, 300 rupees" },
    output: {
      description: "Coffee at Starbucks",
      amount: 300,
      category: "Food"
    }
  }
);

console.log(`Dataset created with 3 examples`);
```

### 39.3 Running Tests on Dataset

```javascript
// File: scripts/runDatasetTest.js

import { Client } from 'langsmith';
import { expenseParserAgent } from '../src/agents/expenseParser.agent.js';

const client = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY
});

// Run agent on dataset
await client.runOnDataset(
  "expense-creation-test-cases",  // Dataset name
  async (input) => {
    // Your agent/chain
    const result = await expenseParserAgent.invoke(input);
    return result;
  },
  {
    projectName: "expense-parser-eval-2026-02-09",
    evaluationConfig: {
      // Optional: Custom evaluators (Chapter 41)
    }
  }
);

console.log("Evaluation complete! Check LangSmith dashboard.");
```

### 39.4 Viewing Test Results

**LangSmith Dashboard** → Datasets → **expense-creation-test-cases** → **Runs**

```
Run: expense-parser-eval-2026-02-09
Date: 2026-02-09 15:45:00
Model: gpt-4o-mini

Results: 2/3 Passed (66.7%)

┌────────────────────────────────────────────────────────────────┐
│ Example                    │ Expected       │ Actual         │ │
├────────────────────────────┼────────────────┼────────────────┤ │
│ "Add 500 for lunch"        │ amount: 500    │ amount: 500    │✓│
│                            │ category: Food │ category: Food │ │
├────────────────────────────┼────────────────┼────────────────┤ │
│ "Spent 2000 on taxi"       │ amount: 2000   │ amount: 2000   │✓│
│                            │ category: Trans│ category: Trans│ │
├────────────────────────────┼────────────────┼────────────────┤ │
│ "Coffee at Starbucks, 300" │ amount: 300    │ amount: 350    │✗│
│                            │ category: Food │ category: Food │ │
│                            │                │ (Wrong amount!)│ │
└────────────────────────────┴────────────────┴────────────────┘

Issues:
- Example 3: LLM confused "300 rupees" → extracted "350"
- Fix: Improve prompt to handle currency more carefully
```

### 39.5 Real Example: ai-langx/ Test Suite

```javascript
// File: scripts/createTestDataset.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

const testCases = [
  // Transactional - Create
  {
    input: { userMessage: "Add 500 for lunch at McDonald's" },
    expectedIntent: "transactional",
    expectedAction: "create_expense",
    expectedOutput: { amount: 500, category: "Food", description: "Lunch at McDonald's" }
  },
  
  // Transactional - List
  {
    input: { userMessage: "Show my expenses from last week" },
    expectedIntent: "transactional",
    expectedAction: "list_expenses",
    expectedOutput: { timeRange: "last week" }
  },
  
  // Q&A
  {
    input: { userMessage: "What's the meal limit?" },
    expectedIntent: "qa",
    expectedOutput: { answer: "₹500 per meal", source: "policy" }
  },
  
  // Reconciliation
  {
    input: { userMessage: "Compare my January expenses with company data" },
    expectedIntent: "reconciliation",
    expectedOutput: { month: "January", action: "compare" }
  },
  
  // Clarification
  {
    input: { userMessage: "Help" },
    expectedIntent: "clarification",
    expectedOutput: { response: "How can I help you with expenses?" }
  }
];

// Create dataset
const dataset = await client.createDataset("ai-langx-integration-tests", {
  description: "Full integration test suite for ai-langx/"
});

// Add all examples
for (const testCase of testCases) {
  await client.createExample(dataset.id, {
    input: testCase.input,
    output: testCase.expectedOutput,
    metadata: {
      expectedIntent: testCase.expectedIntent,
      expectedAction: testCase.expectedAction
    }
  });
}

console.log(`Created dataset with ${testCases.length} test cases`);
```

### 39.6 Automated Testing in CI/CD

```yaml
# .github/workflows/test.yml

name: LangSmith Evaluation

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run LangSmith Evaluation
        env:
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
          LANGCHAIN_TRACING_V2: "true"
          LANGCHAIN_PROJECT: "ai-langx-ci-tests"
        run: node scripts/runDatasetTest.js
      
      - name: Check Results
        run: |
          # Fetch results from LangSmith API
          # Fail CI if pass rate < 95%
```

**✅ You now understand Datasets & Testing!**

---

## Chapter 40: Experiments & A/B Testing

### 40.1 What Are Experiments?

**Experiment = Compare different implementations** (models, prompts, chains)

Use cases:
- 🆚 **Model Comparison**: GPT-4 vs GPT-3.5 vs Claude
- 📝 **Prompt Testing**: Which prompt performs better?
- ⚙️ **Parameter Tuning**: Temperature 0 vs 0.7
- 🔧 **Architecture Testing**: Different RAG strategies

### 40.2 Creating an Experiment

**Scenario**: Compare GPT-4 vs GPT-3.5 for expense categorization

```javascript
// File: experiments/modelComparison.js

import { Client } from 'langsmith';
import { ChatOpenAI } from "@langchain/openai";

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

// Variant A: GPT-4
const variantA = async (input) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4" });
  const result = await llm.invoke(
    `Categorize expense: ${input.description}`
  );
  return { category: result.content };
};

// Variant B: GPT-3.5
const variantB = async (input) => {
  const llm = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
  const result = await llm.invoke(
    `Categorize expense: ${input.description}`
  );
  return { category: result.content };
};

// Run experiment on dataset
await client.evaluateComparative(
  "expense-categorization-test-cases",  // Dataset
  [
    { name: "GPT-4", implementation: variantA },
    { name: "GPT-3.5", implementation: variantB }
  ],
  {
    projectName: "model-comparison-gpt4-vs-gpt35",
    evaluators: [/* Custom evaluators */]
  }
);
```

### 40.3 Viewing Experiment Results

**LangSmith Dashboard** → Experiments → **model-comparison-gpt4-vs-gpt35**

```
Experiment: GPT-4 vs GPT-3.5 (Expense Categorization)
Dataset: 50 test cases

┌────────────────────────────────────────────────────────────┐
│ Metric           │ GPT-4        │ GPT-3.5      │ Winner   │
├──────────────────┼──────────────┼──────────────┼──────────┤
│ Accuracy         │ 96% (48/50)  │ 88% (44/50)  │ GPT-4    │
│ Avg Latency      │ 1.2s         │ 0.8s         │ GPT-3.5  │
│ Avg Cost         │ $0.015       │ $0.003       │ GPT-3.5  │
│ Avg Confidence   │ 0.92         │ 0.85         │ GPT-4    │
└────────────────────────────────────────────────────────────┘

Decision:
- GPT-4: 8% more accurate but 5x more expensive
- For production: Use GPT-3.5 (good enough, cheaper, faster)
- For complex cases: Escalate to GPT-4
```

### 40.4 A/B Testing Different Prompts

```javascript
// Experiment: Which prompt works better?

// Prompt A: Simple
const promptA = "Categorize this expense: {description}";

// Prompt B: Detailed with examples
const promptB = `Categorize this expense into one of these categories:
- Food: Meals, snacks, beverages
- Transport: Taxi, bus, train, flight
- Shopping: Clothing, electronics, books
- Entertainment: Movies, events, subscriptions
- Bills: Utilities, rent, phone
- Healthcare: Doctor, medicine, insurance
- Education: Courses, books, tuition
- Other: Anything else

Examples:
- "Lunch at McDonald's" → Food
- "Uber to office" → Transport
- "Netflix subscription" → Entertainment

Expense: {description}
Category:`;

// Run experiment
await client.evaluateComparative(
  "expense-categorization-test-cases",
  [
    {
      name: "Simple Prompt",
      implementation: async (input) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
        const result = await llm.invoke(
          promptA.replace("{description}", input.description)
        );
        return { category: result.content };
      }
    },
    {
      name: "Detailed Prompt",
      implementation: async (input) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
        const result = await llm.invoke(
          promptB.replace("{description}", input.description)
        );
        return { category: result.content };
      }
    }
  ]
);

// Results:
// - Simple Prompt: 82% accuracy, 0.5s latency, $0.001 cost
// - Detailed Prompt: 94% accuracy, 0.7s latency, $0.003 cost
// Winner: Detailed Prompt (worth the extra cost/latency for accuracy)
```

### 40.5 Real Example: RAG Strategy Comparison

```javascript
// Experiment: Compare RAG retrieval strategies

// Strategy 1: Basic Similarity
const basicRAG = async (input) => {
  const retriever = vectorStore.asRetriever({
    k: 4,
    searchType: "similarity"
  });
  
  const docs = await retriever.getRelevantDocuments(input.query);
  const answer = await llm.invoke(formatPrompt(input.query, docs));
  return { answer: answer.content, numDocs: docs.length };
};

// Strategy 2: MMR (Maximal Marginal Relevance)
const mmrRAG = async (input) => {
  const retriever = vectorStore.asRetriever({
    k: 4,
    searchType: "mmr",
    searchKwargs: { fetchK: 10, lambda: 0.5 }
  });
  
  const docs = await retriever.getRelevantDocuments(input.query);
  const answer = await llm.invoke(formatPrompt(input.query, docs));
  return { answer: answer.content, numDocs: docs.length };
};

// Strategy 3: Multi-Query
const multiQueryRAG = async (input) => {
  // Generate 3 variations of query
  const queries = await generateQueryVariations(input.query);
  
  // Retrieve for each query
  const allDocs = [];
  for (const query of queries) {
    const docs = await vectorStore.similaritySearch(query, 2);
    allDocs.push(...docs);
  }
  
  // Deduplicate and answer
  const uniqueDocs = deduplicateDocuments(allDocs);
  const answer = await llm.invoke(formatPrompt(input.query, uniqueDocs));
  return { answer: answer.content, numDocs: uniqueDocs.length };
};

// Run experiment
await client.evaluateComparative(
  "qa-test-cases",
  [
    { name: "Basic Similarity", implementation: basicRAG },
    { name: "MMR", implementation: mmrRAG },
    { name: "Multi-Query", implementation: multiQueryRAG }
  ]
);

// Results:
// - Basic: 75% accuracy, 1.0s latency
// - MMR: 78% accuracy, 1.1s latency (slightly better diversity)
// - Multi-Query: 85% accuracy, 2.5s latency (best but slowest)
// Decision: Use Multi-Query for complex questions, Basic for simple ones
```

### 40.6 Experiment Best Practices

#### **1. Use Same Dataset**

```javascript
// ✅ Good: Compare on same test cases
await client.evaluateComparative(
  "expense-test-cases",  // Same dataset for all variants
  [variantA, variantB]
);

// ❌ Bad: Different datasets
await variantA.test("dataset-a");
await variantB.test("dataset-b");  // Can't compare fairly
```

#### **2. Run Multiple Times**

```javascript
// Account for randomness (temperature > 0)
const results = [];
for (let i = 0; i < 5; i++) {
  const result = await runExperiment();
  results.push(result);
}

const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / 5;
```

#### **3. Document Experiment**

```javascript
await client.evaluateComparative(
  "expense-test-cases",
  [variantA, variantB],
  {
    projectName: "gpt4-vs-gpt35-2026-02-09",
    metadata: {
      hypothesis: "GPT-4 will be more accurate for complex expenses",
      date: "2026-02-09",
      experimenter: "john@example.com"
    }
  }
);
```

**✅ You now understand Experiments & A/B Testing!**

---

## Chapter 41: Evaluators

### 41.1 What Are Evaluators?

**Evaluator = Automated function that scores AI output** (correctness, relevance, quality)

Use cases:
- ✅ **Automated Testing**: Score outputs without manual review
- 📊 **Regression Detection**: Catch quality degradation
- 🎯 **Objective Metrics**: Consistent evaluation criteria
- 🔄 **Continuous Monitoring**: Evaluate every production run

### 41.2 Types of Evaluators

#### **1. Exact Match**

```javascript
const exactMatchEvaluator = (output, expected) => {
  return output.trim().toLowerCase() === expected.trim().toLowerCase() ? 1.0 : 0.0;
};

// Use case: Structured outputs (categories, classifications)
```

#### **2. Substring Match**

```javascript
const substringEvaluator = (output, expected) => {
  return output.toLowerCase().includes(expected.toLowerCase()) ? 1.0 : 0.0;
};

// Use case: Check if key information is present
```

#### **3. LLM-as-Judge** (Most powerful)

```javascript
const llmJudgeEvaluator = async (input, output, expected) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  
  const prompt = `Evaluate if the AI's answer is correct.

Question: ${input.query}
Expected Answer: ${expected}
AI's Answer: ${output}

Score the answer:
- 1.0: Correct and complete
- 0.7: Mostly correct but missing details
- 0.3: Partially correct
- 0.0: Incorrect

Provide score as JSON: {"score": 0.0-1.0, "reasoning": "..."}
`;

  const result = await llm.invoke(prompt);
  const { score, reasoning } = JSON.parse(result.content);
  
  return { score, reasoning };
};
```

#### **4. Semantic Similarity**

```javascript
import { OpenAIEmbeddings } from "@langchain/openai";
import { cosineSimilarity } from "../utils/similarity.js";

const semanticSimilarityEvaluator = async (output, expected) => {
  const embeddings = new OpenAIEmbeddings();
  
  const [outputEmb] = await embeddings.embedDocuments([output]);
  const [expectedEmb] = await embeddings.embedDocuments([expected]);
  
  const similarity = cosineSimilarity(outputEmb, expectedEmb);
  
  return similarity;  // 0.0 to 1.0
};

// Use case: Flexible matching (paraphrases)
```

### 41.3 Real Example: Expense Categorization Evaluator

```javascript
// File: evaluators/expenseCategoryEvaluator.js

import { ChatOpenAI } from "@langchain/openai";

export const expenseCategoryEvaluator = async (input, output, expected) => {
  // Exact match for category
  if (output.category === expected.category) {
    return { score: 1.0, comment: "Exact category match" };
  }
  
  // Partial credit for similar categories
  const similarCategories = {
    "Food": ["Food & Beverages", "Meals", "Dining"],
    "Transport": ["Transportation", "Travel", "Commute"],
    "Shopping": ["Retail", "Purchases"]
  };
  
  for (const [canonical, variants] of Object.entries(similarCategories)) {
    if (
      (output.category === canonical && variants.includes(expected.category)) ||
      (expected.category === canonical && variants.includes(output.category))
    ) {
      return { score: 0.8, comment: "Similar category (acceptable)" };
    }
  }
  
  // LLM judge for unclear cases
  const llm = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });
  
  const prompt = `Is the categorization correct or acceptable?

Expense: "${input.description}"
Expected Category: ${expected.category}
AI Category: ${output.category}

Is the AI's category correct or at least acceptable? Respond with:
{"acceptable": true/false, "reasoning": "..."}
`;

  const result = await llm.invoke(prompt);
  const { acceptable, reasoning } = JSON.parse(result.content);
  
  return {
    score: acceptable ? 0.6 : 0.0,
    comment: reasoning
  };
};
```

### 41.4 RAG Quality Evaluators

#### **Answer Relevance** (Does answer address question?)

```javascript
const answerRelevanceEvaluator = async (input, output) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  
  const prompt = `Does the answer address the question?

Question: ${input.query}
Answer: ${output.answer}

Score:
- 1.0: Directly answers question
- 0.7: Partially answers
- 0.3: Tangentially related
- 0.0: Unrelated

JSON: {"score": 0.0-1.0, "reasoning": "..."}
`;

  const result = await llm.invoke(prompt);
  return JSON.parse(result.content);
};
```

#### **Faithfulness** (Does answer match retrieved context?)

```javascript
const faithfulnessEvaluator = async (output, context) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  
  const prompt = `Is the answer faithful to the context (no hallucination)?

Context (Retrieved Documents):
${context.map(doc => doc.pageContent).join("\n\n")}

Answer: ${output.answer}

Check if answer is grounded in context:
- 1.0: All claims supported by context
- 0.5: Some claims from context, some added
- 0.0: Answer contradicts or ignores context

JSON: {"score": 0.0-1.0, "hallucinations": [...]}
`;

  const result = await llm.invoke(prompt);
  return JSON.parse(result.content);
};
```

#### **Context Relevance** (Are retrieved docs relevant?)

```javascript
const contextRelevanceEvaluator = async (input, retrievedDocs) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
  
  const scores = [];
  
  for (const doc of retrievedDocs) {
    const prompt = `Is this document relevant to the question?

Question: ${input.query}
Document: ${doc.pageContent}

Score: 1.0 (relevant) or 0.0 (not relevant)
JSON: {"score": 0.0/1.0}
`;

    const result = await llm.invoke(prompt);
    const { score } = JSON.parse(result.content);
    scores.push(score);
  }
  
  // Average relevance
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  
  return {
    score: avgScore,
    individualScores: scores
  };
};
```

### 41.5 Using Evaluators in Tests

```javascript
// File: scripts/evaluateDataset.js

import { Client } from 'langsmith';
import { intentRouterGraph } from '../src/graphs/intentRouter.graph.js';
import {
  expenseCategoryEvaluator,
  answerRelevanceEvaluator,
  faithfulnessEvaluator
} from '../evaluators/index.js';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

await client.runOnDataset(
  "ai-langx-integration-tests",
  async (input, config) => {
    const result = await intentRouterGraph.invoke(input, config);
    return result;
  },
  {
    projectName: "ai-langx-eval-2026-02-09",
    evaluators: [
      expenseCategoryEvaluator,
      answerRelevanceEvaluator,
      faithfulnessEvaluator
    ]
  }
);

// Dashboard shows:
// - Overall Score: 0.87 (87%)
// - expenseCategoryEvaluator: 0.92 (92% of categories correct)
// - answerRelevanceEvaluator: 0.85 (85% of answers relevant)
// - faithfulnessEvaluator: 0.84 (84% faithful to context, 16% hallucinated)
```

### 41.6 Production Evaluators (Sampling)

```javascript
// File: src/middleware/productionEvaluator.js

import { answerRelevanceEvaluator } from '../evaluators/index.js';

export const productionEvaluatorMiddleware = async (req, res, next) => {
  // Capture response
  const originalSend = res.json;
  
  res.json = async function (data) {
    // Sample 10% of requests for evaluation
    if (Math.random() < 0.1) {
      try {
        // Evaluate in background (don't block response)
        setImmediate(async () => {
          const evaluation = await answerRelevanceEvaluator(
            { query: req.body.message },
            { answer: data.answer }
          );
          
          // Log to LangSmith
          await logEvaluation({
            runId: data.runId,
            evaluator: "answer-relevance",
            score: evaluation.score,
            reasoning: evaluation.reasoning
          });
        });
      } catch (error) {
        console.error("[Evaluator] Error:", error);
      }
    }
    
    // Send response immediately
    originalSend.call(this, data);
  };
  
  next();
};
```

**✅ You now understand Evaluators!**

---

## Chapter 42: Production Monitoring

### 42.1 Production Monitoring Strategy

**Monitor 4 key metrics**:

1. **Cost**: Total spend, cost per user, cost per feature
2. **Latency**: Response times, p95, p99
3. **Error Rate**: Failures, rate limits, timeouts
4. **Quality**: User feedback, evaluator scores

### 42.2 Cost Monitoring

#### **Dashboard View**

```
LangSmith Dashboard → Project → Analytics → Cost

Total Cost (Last 30 Days): $1,234.56

Breakdown:
├─ LLM Calls: $1,100.00 (89%)
│  ├─ gpt-4o-mini: $800.00 (65%)
│  ├─ gpt-4: $250.00 (20%)
│  └─ gpt-3.5-turbo: $50.00 (4%)
├─ Embeddings: $120.00 (10%)
│  └─ text-embedding-3-small: $120.00
└─ Other: $14.56 (1%)

Cost by Feature:
├─ transactional: $600.00 (49%)
├─ qa: $400.00 (32%)
├─ reconciliation: $200.00 (16%)
└─ clarification: $34.56 (3%)

Cost per User:
- Top 10 users account for 45% of cost
- user-456: $45.67 (highest)
- user-789: $38.23
- ...
```

#### **Cost Alerts**

```javascript
// File: scripts/monitorCosts.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

// Check daily costs
const today = new Date();
const runs = await client.listRuns({
  projectName: "ai-expense-tracker-prod",
  startTime: new Date(today.setHours(0, 0, 0, 0)),
  endTime: new Date()
});

const totalCost = runs.reduce((sum, run) => sum + (run.totalCost || 0), 0);

// Alert if over budget
const DAILY_BUDGET = 50;  // $50/day

if (totalCost > DAILY_BUDGET) {
  await sendAlert({
    subject: "⚠️ LLM Cost Alert",
    message: `Daily cost ($${totalCost.toFixed(2)}) exceeded budget ($${DAILY_BUDGET})`
  });
}
```

### 42.3 Latency Monitoring

#### **Dashboard View**

```
LangSmith Dashboard → Project → Analytics → Latency

Avg Latency (Last 24h): 1.8s

Percentiles:
- p50: 1.2s ← 50% of requests finish in 1.2s or less
- p95: 3.5s ← 95% finish in 3.5s
- p99: 5.2s ← 99% finish in 5.2s
- Max: 12.3s

Slowest Operations:
1. Reconciliation: 4.5s avg
2. RAG Q&A: 2.8s avg
3. Transactional: 1.5s avg
4. Clarification: 0.8s avg

Latency by Step:
├─ LLM Calls: 1.2s (67%)
├─ Tool Execution: 0.4s (22%)
├─ Retrieval: 0.15s (8%)
└─ Other: 0.05s (3%)
```

#### **Latency Alerts**

```javascript
// File: scripts/monitorLatency.js

const runs = await client.listRuns({
  projectName: "ai-expense-tracker-prod",
  startTime: new Date(Date.now() - 60 * 60 * 1000)  // Last 1 hour
});

// Calculate p95
const latencies = runs.map(r => r.latency).sort((a, b) => a - b);
const p95Index = Math.floor(latencies.length * 0.95);
const p95Latency = latencies[p95Index];

// Alert if p95 > 5s
const P95_THRESHOLD = 5000;  // 5 seconds

if (p95Latency > P95_THRESHOLD) {
  await sendAlert({
    subject: "⚠️ High Latency Alert",
    message: `p95 latency (${p95Latency}ms) exceeded threshold (${P95_THRESHOLD}ms)`
  });
}
```

### 42.4 Error Rate Monitoring

#### **Dashboard View**

```
LangSmith Dashboard → Project → Analytics → Errors

Error Rate (Last 24h): 3.2% (32 errors / 1,000 runs)

Error Breakdown:
├─ Rate Limit Exceeded: 15 (47%)
│  └─ Fix: Implement exponential backoff
├─ Timeout: 10 (31%)
│  └─ Fix: Increase timeout or optimize prompt
├─ Invalid Input: 5 (16%)
│  └─ Fix: Better input validation
└─ Unknown: 2 (6%)

Errors by Feature:
├─ reconciliation: 18 errors (56%)
├─ transactional: 8 errors (25%)
├─ qa: 6 errors (19%)
```

#### **Error Alerts**

```javascript
// File: scripts/monitorErrors.js

const runs = await client.listRuns({
  projectName: "ai-expense-tracker-prod",
  startTime: new Date(Date.now() - 15 * 60 * 1000),  // Last 15 min
  error: true  // Only failed runs
});

const totalRuns = await client.listRuns({
  projectName: "ai-expense-tracker-prod",
  startTime: new Date(Date.now() - 15 * 60 * 1000)
});

const errorRate = runs.length / totalRuns.length;

// Alert if error rate > 5%
const ERROR_RATE_THRESHOLD = 0.05;

if (errorRate > ERROR_RATE_THRESHOLD) {
  await sendAlert({
    subject: "🚨 High Error Rate Alert",
    message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeded ${ERROR_RATE_THRESHOLD * 100}%\n\nRecent errors:\n${runs.slice(0, 5).map(r => `- ${r.error.message}`).join('\n')}`
  });
}
```

### 42.5 Quality Monitoring (Feedback)

```javascript
// File: scripts/monitorQuality.js

// Get feedback from last 24h
const runs = await client.listRuns({
  projectName: "ai-expense-tracker-prod",
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  hasFeedback: true
});

// Calculate satisfaction rate
const positiveCount = runs.filter(r => r.feedback.score > 0.5).length;
const totalFeedback = runs.length;
const satisfactionRate = positiveCount / totalFeedback;

console.log(`Satisfaction Rate: ${(satisfactionRate * 100).toFixed(1)}%`);

// Alert if satisfaction drops below 85%
if (satisfactionRate < 0.85) {
  await sendAlert({
    subject: "📉 Low Satisfaction Alert",
    message: `User satisfaction (${(satisfactionRate * 100).toFixed(1)}%) dropped below 85%`
  });
}

// Analyze negative feedback
const negativeFeedback = runs.filter(r => r.feedback.score <= 0.5);
console.log("\nNegative Feedback:");
negativeFeedback.slice(0, 10).forEach(r => {
  console.log(`- ${r.feedback.comment || "(no comment)"}`);
});
```

### 42.6 Real-Time Dashboard

```javascript
// File: scripts/realtimeDashboard.js

import { Client } from 'langsmith';

const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });

setInterval(async () => {
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);
  
  const runs = await client.listRuns({
    projectName: "ai-expense-tracker-prod",
    startTime: lastHour
  });
  
  const errors = runs.filter(r => r.error);
  const totalCost = runs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const avgLatency = runs.reduce((sum, r) => sum + r.latency, 0) / runs.length;
  
  console.clear();
  console.log("=== AI Expense Tracker - Real-Time Monitoring ===");
  console.log(`Time: ${new Date().toLocaleTimeString()}`);
  console.log(`\nLast Hour:`);
  console.log(`- Total Runs: ${runs.length}`);
  console.log(`- Errors: ${errors.length} (${(errors.length / runs.length * 100).toFixed(1)}%)`);
  console.log(`- Avg Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`- Total Cost: $${totalCost.toFixed(4)}`);
  
  if (errors.length > 0) {
    console.log(`\nRecent Errors:`);
    errors.slice(0, 3).forEach(r => {
      console.log(`- ${r.error.message}`);
    });
  }
}, 30000);  // Update every 30 seconds
```

### 42.7 Production Best Practices

#### **1. Tag Everything**

```javascript
// Consistent tagging enables filtering
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  tags: [
    "production",  // Environment
    "feature-expense",  // Feature
    "user-456",  // User
    "v1.2.3"  // Version
  ],
  metadata: {
    userId: 456,
    feature: "expense-creation",
    sessionId: "session-789"
  }
});
```

#### **2. Sample Expensive Operations**

```javascript
// Don't trace everything in production
const shouldTrace = Math.random() < 0.1;  // 10% sampling

if (!shouldTrace) {
  process.env.LANGCHAIN_TRACING_V2 = "false";
}

await llm.invoke("...");

process.env.LANGCHAIN_TRACING_V2 = "true";  // Restore
```

#### **3. Set Up Alerts**

```javascript
// Cron job: Check metrics every 15 minutes
// Alert on:
// - Error rate > 5%
// - p95 latency > 5s
// - Daily cost > $50
// - Satisfaction < 85%
```

#### **4. Monitor by User**

```javascript
// Find expensive users
const userCosts = {};

runs.forEach(run => {
  const userId = run.metadata.userId;
  if (!userCosts[userId]) userCosts[userId] = 0;
  userCosts[userId] += run.totalCost || 0;
});

// Sort by cost
const topUsers = Object.entries(userCosts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log("Top 10 Most Expensive Users:");
topUsers.forEach(([userId, cost]) => {
  console.log(`- User ${userId}: $${cost.toFixed(2)}`);
});
```

**✅ You now understand Production Monitoring!**

---

## Part 6 Hands-On Challenge

Build a **Complete LangSmith Monitoring Setup** for ai-langx/!

### Requirements:

1. **Tracing Setup**
   - Environment variables configured
   - Tags and metadata in all handlers
   - Run IDs returned to frontend

2. **Feedback Collection**
   - Thumbs up/down buttons in UI
   - API endpoint to submit feedback
   - Optional comments for negative feedback

3. **Testing Suite**
   - Dataset with 20+ test cases
   - Automated evaluation script
   - CI/CD integration

4. **Monitoring Dashboard**
   - Cost monitoring script
   - Latency monitoring script
   - Error rate alerts
   - Quality tracking (feedback analysis)

5. **Experiment**
   - Compare 2 models or prompts
   - Run on test dataset
   - Document results and decision

### Bonus:

- Custom evaluators for expense categorization
- Real-time monitoring dashboard (refreshes every 30s)
- Cost optimization recommendations
- Production alert system (email/Slack)

**🎉 Congratulations! You've mastered LangSmith!**

---

## Next Steps

1. **Integrate**: Add LangSmith to all ai-langx/ handlers
2. **Monitor**: Set up production monitoring
3. **Evaluate**: Create test suites for critical features
4. **Optimize**: Use insights to improve prompts and reduce costs
5. **Scale**: Confident production deployment with observability

Continue to **Part 7: Integration & Production** to learn deployment best practices!
