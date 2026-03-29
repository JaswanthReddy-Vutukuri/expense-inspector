# LangChain, LangGraph & LangSmith
## Complete Beginner-to-Expert Guide

**For AI-LangX Expense Tracker Implementation**

---

**Document Information**
- **Date**: February 9, 2026
- **Purpose**: Complete learning resource for understanding LangChain, LangGraph, and LangSmith
- **Audience**: Beginners to advanced developers
- **Implementation Focus**: ai-langx/ expense tracker codebase
- **Total Concepts**: 270+
- **Learning Time**: 20-40 hours

---

## Table of Contents

### Part I: Foundations
1. [Prerequisites & Environment Setup](#part-i-foundations)
2. [JavaScript/Node.js Essentials](#chapter-2-javascriptnodejs-essentials)
3. [LLM Fundamentals](#chapter-3-llm-fundamentals)
4. [Understanding AI Orchestration](#chapter-4-understanding-ai-orchestration)

### Part II: LangChain Core
5. [Models - Talking to LLMs](#chapter-5-models---talking-to-llms)
6. [Prompts - Instructing LLMs](#chapter-6-prompts---instructing-llms)
7. [Tools - Extending LLM Capabilities](#chapter-7-tools---extending-llm-capabilities)
8. [Agents - Autonomous Decision Making](#chapter-8-agents---autonomous-decision-making)
9. [Chains - Sequential Operations](#chapter-9-chains---sequential-operations)
10. [Memory - Conversation Context](#chapter-10-memory---conversation-context)

### Part III: LangChain RAG
11. [Document Loaders - Ingesting Data](#chapter-11-document-loaders---ingesting-data)
12. [Text Splitters - Chunking Documents](#chapter-12-text-splitters---chunking-documents)
13. [Embeddings - Vector Representations](#chapter-13-embeddings---vector-representations)
14. [Vector Stores - Storing Embeddings](#chapter-14-vector-stores---storing-embeddings)
15. [Retrievers - Finding Relevant Info](#chapter-15-retrievers---finding-relevant-info)
16. [RAG Chains - Question Answering](#chapter-16-rag-chains---question-answering)

### Part IV: LangChain Advanced
17. [LCEL - Expression Language](#chapter-17-lcel---expression-language)
18. [Runnables - Building Blocks](#chapter-18-runnables---building-blocks)
19. [Output Parsers - Structured Responses](#chapter-19-output-parsers---structured-responses)
20. [Callbacks - Event Handling](#chapter-20-callbacks---event-handling)
21. [Caching - Performance Optimization](#chapter-21-caching---performance-optimization)
22. [Advanced Retrievers](#chapter-22-advanced-retrievers)
23. [Advanced Chains](#chapter-23-advanced-chains)

### Part V: LangGraph
24. [StateGraph Fundamentals](#chapter-24-stategraph-fundamentals)
25. [Nodes - State Transformers](#chapter-25-nodes---state-transformers)
26. [Edges - Connecting Flow](#chapter-26-edges---connecting-flow)
27. [State Management](#chapter-27-state-management)
28. [Conditional Routing](#chapter-28-conditional-routing)
29. [Parallel Execution](#chapter-29-parallel-execution)
30. [Persistence & Checkpoints](#chapter-30-persistence--checkpoints)
31. [Streaming & Real-time Updates](#chapter-31-streaming--real-time-updates)
32. [Advanced LangGraph Patterns](#chapter-32-advanced-langgraph-patterns)

### Part VI: LangSmith
33. [Observability Basics](#chapter-33-observability-basics)
34. [Tracing & Debugging](#chapter-34-tracing--debugging)
35. [Tags & Metadata](#chapter-35-tags--metadata)
36. [Analytics & Dashboards](#chapter-36-analytics--dashboards)
37. [Datasets & Testing](#chapter-37-datasets--testing)
38. [Experiments & A/B Testing](#chapter-38-experiments--ab-testing)
39. [Evaluators & Quality Assurance](#chapter-39-evaluators--quality-assurance)
40. [Production Monitoring](#chapter-40-production-monitoring)

### Part VII: Integration & Best Practices
41. [Integrating All Three Frameworks](#chapter-41-integrating-all-three-frameworks)
42. [AI-LangX Implementation Walkthrough](#chapter-42-ai-langx-implementation-walkthrough)
43. [Production Best Practices](#chapter-43-production-best-practices)
44. [Troubleshooting & Debugging](#chapter-44-troubleshooting--debugging)

---

# Part I: Foundations

## Chapter 1: Prerequisites & Environment Setup

### 1.1 What You'll Learn

**By the end of this guide, you will understand**:
- How to build production-ready AI applications
- LangChain's component ecosystem (270+ concepts)
- LangGraph's stateful workflow engine
- LangSmith's observability platform
- Real-world implementation patterns from ai-langx/

**What this guide covers**:
- ✅ Complete concept explanations
- ✅ Code examples from ai-langx/ codebase
- ✅ Practical use cases
- ✅ Common pitfalls and solutions
- ✅ Production deployment strategies

### 1.2 Assumed Knowledge

**You should be comfortable with**:
- ✅ Basic programming (any language)
- ✅ Command line usage
- ✅ Installing software packages
- ✅ Reading JSON/configuration files

**Nice to have (but we'll explain)**:
- JavaScript/TypeScript basics
- HTTP/REST APIs
- Asynchronous programming
- Database concepts

**No prior AI/ML knowledge required!** We'll explain everything from scratch.

### 1.3 Development Environment

#### **Required Software**

```bash
# 1. Node.js (v18 or higher)
node --version  # Should show v18.x.x or higher

# 2. npm (comes with Node.js)
npm --version  # Should show 9.x.x or higher

# 3. Git (for cloning repositories)
git --version

# 4. Code editor (VS Code recommended)
# Download from: https://code.visualstudio.com/
```

#### **Environment Setup**

```bash
# Clone the repository
cd Desktop
git clone <repository-url>
cd expense-inspector

# Navigate to ai-langx folder
cd ai-langx

# Install dependencies
npm install

# This installs:
# ✅ langchain (core framework)
# ✅ @langchain/openai (OpenAI integration)
# ✅ @langchain/langgraph (workflow engine)
# ✅ langsmith (observability)
# ✅ express (web server)
# ✅ zod (validation)
# ✅ axios (HTTP client)
```

#### **Environment Variables**

Create `.env` file in `ai-langx/` folder:

```bash
# OpenAI API (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# LangSmith (Get from: https://smith.langchain.com)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
LANGCHAIN_PROJECT=expense-tracker-learning

# Backend API
BACKEND_URL=http://localhost:3003

# Server
PORT=3002
NODE_ENV=development
```

**💡 Tip**: Copy from `env.template` file provided in the repository.

### 1.4 Verification

Test your setup:

```bash
# Start the server
npm start

# You should see:
# [Server] Starting AI-LangX on port 3002...
# [LangSmith] Tracing enabled: true
# [Server] AI-LangX ready ✓

# Test endpoint (in another terminal)
curl http://localhost:3002/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-09T10:00:00.000Z"}
```

✅ **If you see this, you're ready to learn!**

---

## Chapter 2: JavaScript/Node.js Essentials

### 2.1 Why JavaScript?

**LangChain has two versions**:
- **Python** (langchain-python) - Original, most features
- **JavaScript** (langchain-js) - For web apps, Node.js servers

**ai-langx/ uses JavaScript** because:
- ✅ Same language as frontend (Angular)
- ✅ Runs on Node.js servers
- ✅ Easy integration with Express.js
- ✅ npm ecosystem for packages

### 2.2 Concept: Async/Await (CRITICAL)

**Problem**: LLM calls take time (1-5 seconds). We can't freeze the program!

**Solution**: Asynchronous programming with async/await.

#### **Example 1: Synchronous (BAD - Freezes)**

```javascript
// ❌ This would freeze the server for 2 seconds
function slowFunction() {
  const start = Date.now();
  while (Date.now() - start < 2000) {
    // Wait 2 seconds doing nothing
  }
  return "Done";
}

const result = slowFunction();  // Server frozen!
console.log(result);
```

#### **Example 2: Asynchronous (GOOD - Non-blocking)**

```javascript
// ✅ This allows other work while waiting
async function callLLM() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello" }]
  });
  return response.choices[0].message.content;
}

// Usage
const result = await callLLM();  // Waits without blocking
console.log(result);
```

#### **Key Terms**

- **async** - Declares a function returns a Promise
- **await** - Waits for a Promise to resolve
- **Promise** - Represents a future value (like a receipt)

#### **Real Example from ai-langx/**

```javascript
// File: src/agents/expense.agent.js
export const createExpenseAgent = async (authToken, context = {}) => {
  // ↑ async keyword makes this function return a Promise
  
  // Create LLM (fast, returns immediately)
  const llm = createLLM({
    temperature: 0.7,
    tags: getTraceTags('transactional', context.userId)
  });
  
  // Create tools (fast)
  const tools = createToolsWithContext(authToken, context);
  
  // Create agent executor (fast)
  return new AgentExecutor({
    agent: await createOpenAIToolsAgent({ llm, tools, prompt }),
    //     ↑ await because agent creation is async
    tools,
    maxIterations: 5
  });
};

// Calling the function
const agent = await createExpenseAgent(token, { userId: 123 });
//             ↑ Must use await because function is async
```

**💡 Rule of Thumb**: Any function that calls LLMs, databases, or APIs should be `async` and use `await`.

### 2.3 Concept: Promises

**What is a Promise?**

A Promise is like ordering food at a restaurant:
1. **Pending** - You order (request sent), kitchen cooking
2. **Fulfilled** - Food arrives (success, got data)
3. **Rejected** - Kitchen ran out of ingredients (error occurred)

#### **Promise Example**

```javascript
// Creating a Promise
const orderFood = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      resolve("🍕 Pizza delivered!");  // Success
    } else {
      reject("❌ Kitchen closed");  // Failure
    }
  }, 2000);  // 2 second delay
});

// Using the Promise
orderFood
  .then(result => console.log(result))  // If success
  .catch(error => console.error(error));  // If failure

// Modern way with async/await
try {
  const result = await orderFood;
  console.log(result);
} catch (error) {
  console.error(error);
}
```

#### **LangChain Returns Promises**

```javascript
// All these return Promises (must await)
const result1 = await llm.invoke("Hello");
const result2 = await vectorStore.similaritySearch("query");
const result3 = await agent.invoke({ input: "Add expense" });
```

**❌ Common Mistake**:

```javascript
// Forgot await - result is a Promise object, not the actual data!
const result = llm.invoke("Hello");
console.log(result);  // Prints: Promise { <pending> }
```

**✅ Correct**:

```javascript
const result = await llm.invoke("Hello");
console.log(result);  // Prints: "Hello! How can I help you?"
```

### 2.4 Concept: ES6 Modules (import/export)

**ai-langx/ uses ES6 modules** (modern JavaScript).

#### **Exporting**

```javascript
// File: src/utils/helpers.js
export const multiply = (a, b) => a * b;

export const divide = (a, b) => {
  if (b === 0) throw new Error("Cannot divide by zero");
  return a / b;
};

export default function greet(name) {
  return `Hello, ${name}!`;
}
```

#### **Importing**

```javascript
// File: src/app.js
import greet from './utils/helpers.js';  // Default export
import { multiply, divide } from './utils/helpers.js';  // Named exports

console.log(greet("Alice"));  // "Hello, Alice!"
console.log(multiply(3, 4));  // 12
```

#### **Real Example from ai-langx/**

```javascript
// File: src/tools/index.js
import { CreateExpenseTool } from './createExpense.tool.js';
import { ListExpensesTool } from './listExpenses.tool.js';
import { ModifyExpenseTool } from './modifyExpense.tool.js';

export const createToolsWithContext = (authToken, context) => {
  return [
    new CreateExpenseTool(authToken, context),
    new ListExpensesTool(authToken, context),
    new ModifyExpenseTool(authToken, context)
  ];
};
```

### 2.5 Concept: Arrow Functions

**Shorthand for functions** - very common in modern JavaScript.

#### **Traditional Function**

```javascript
function add(a, b) {
  return a + b;
}
```

#### **Arrow Function (Equivalent)**

```javascript
const add = (a, b) => {
  return a + b;
};

// Even shorter (implicit return)
const add = (a, b) => a + b;
```

#### **When Used in ai-langx/**

```javascript
// LangGraph node function (arrow function)
const classifyIntent = async (state) => {
  const llm = new ChatOpenAI({ temperature: 0 });
  const response = await llm.invoke(state.userMessage);
  return { intent: response.intent };
};

// Array methods (common with arrow functions)
const filtered = expenses.filter(exp => exp.amount > 500);
const amounts = expenses.map(exp => exp.amount);
const total = amounts.reduce((sum, amt) => sum + amt, 0);
```

### 2.6 Concept: Destructuring

**Extracting values from objects/arrays** - cleaner code.

#### **Object Destructuring**

```javascript
// Without destructuring
const user = { name: "Alice", age: 30, city: "NYC" };
const name = user.name;
const age = user.age;

// With destructuring (cleaner!)
const { name, age } = user;
console.log(name);  // "Alice"
console.log(age);   // 30

// With default values
const { name, country = "USA" } = user;
console.log(country);  // "USA" (default, not in object)
```

#### **Array Destructuring**

```javascript
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
console.log(first);  // 1
console.log(second);  // 2
console.log(rest);   // [3, 4, 5]
```

#### **Real Example from ai-langx/**

```javascript
// File: src/graphs/intent-router.graph.js
const classifyIntent = async (state) => {
  // Destructure state object
  const { userMessage, conversationHistory, userId } = state;
  //      ↑ Extract these fields from state
  
  // Use them directly
  const context = conversationHistory.slice(-6);
  const llm = new ChatOpenAI({ temperature: 0 });
  
  return { intent: "expense_operation", confidence: 0.95 };
};
```

### 2.7 Concept: Spread Operator (...)

**Copying and merging objects/arrays**.

#### **Array Spread**

```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// Combine arrays
const combined = [...arr1, ...arr2];  // [1, 2, 3, 4, 5, 6]

// Copy array
const copy = [...arr1];  // [1, 2, 3] (new array)
```

#### **Object Spread**

```javascript
const user = { name: "Alice", age: 30 };
const details = { city: "NYC", country: "USA" };

// Merge objects
const fullUser = { ...user, ...details };
// { name: "Alice", age: 30, city: "NYC", country: "USA" }

// Override properties
const olderUser = { ...user, age: 31 };
// { name: "Alice", age: 31 }
```

#### **Real Example from ai-langx/** (State Management)

```javascript
// LangGraph state updates use spread
const myNode = async (state) => {
  // Return partial update (spread merges with existing state)
  return {
    ...state,  // Keep all existing fields
    output: "new value",  // Add/update this field
    timestamp: Date.now()  // Add/update this field
  };
};
```

### 2.8 Concept: Classes

**Object-oriented programming** - LangChain uses classes for tools.

#### **Basic Class**

```javascript
class Person {
  // Constructor - called when creating new instance
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  // Method
  greet() {
    return `Hi, I'm ${this.name}, ${this.age} years old`;
  }
}

// Create instance
const alice = new Person("Alice", 30);
console.log(alice.greet());  // "Hi, I'm Alice, 30 years old"
```

#### **Inheritance**

```javascript
class Employee extends Person {
  constructor(name, age, jobTitle) {
    super(name, age);  // Call parent constructor
    this.jobTitle = jobTitle;
  }
  
  work() {
    return `${this.name} is working as ${this.jobTitle}`;
  }
}

const bob = new Employee("Bob", 25, "Developer");
console.log(bob.greet());  // Inherited from Person
console.log(bob.work());   // "Bob is working as Developer"
```

#### **Real Example from ai-langx/** (StructuredTool)

```javascript
// File: src/tools/createExpense.tool.js
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export class CreateExpenseTool extends StructuredTool {
  //            ↑ Extends (inherits from) StructuredTool
  
  // Properties
  name = "create_expense";
  description = "Add a new expense to the database";
  
  // Schema (validation)
  schema = z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    description: z.string().default("")
  });
  
  // Constructor (runs when creating instance)
  constructor(authToken, context) {
    super();  // Call parent constructor
    this.authToken = authToken;
    this.userId = context.userId;
  }
  
  // Override parent method
  async _call(args) {
    // Implementation
    const result = await createExpenseInBackend(args);
    return JSON.stringify(result);
  }
}

// Usage
const tool = new CreateExpenseTool("jwt-token", { userId: 123 });
const result = await tool._call({ amount: 500, category: "Food" });
```

**Key Points**:
- **extends** - Inherit from parent class
- **super()** - Call parent constructor
- **this** - Refer to current instance
- **override** - Replace parent method with custom implementation

### 2.9 Concept: JSON (Data Format)

**JavaScript Object Notation** - common data exchange format.

#### **JSON Basics**

```javascript
// JavaScript Object
const user = {
  name: "Alice",
  age: 30,
  active: true,
  hobbies: ["reading", "coding"]
};

// Convert to JSON string
const jsonString = JSON.stringify(user);
console.log(jsonString);
// '{"name":"Alice","age":30,"active":true,"hobbies":["reading","coding"]}'

// Convert from JSON string
const parsed = JSON.parse(jsonString);
console.log(parsed.name);  // "Alice"
```

#### **Real Example from ai-langx/** (Tool Results)

```javascript
// File: src/tools/createExpense.tool.js
async _call(args) {
  const response = await backendClient.post('/expenses', {
    amount: args.amount,
    category_id: args.categoryId,
    date: args.date
  });
  
  // Tools must return strings, so convert to JSON
  return JSON.stringify({
    success: true,
    message: "Expense added successfully",
    expense: response.data.expense
  });
}

// LLM receives this string, can parse and understand it
```

### 2.10 Quick Reference: Common Patterns

#### **Try-Catch (Error Handling)**

```javascript
try {
  const result = await riskyOperation();
  console.log("Success:", result);
} catch (error) {
  console.error("Error occurred:", error.message);
  // Handle error gracefully
}
```

#### **Template Literals (String Interpolation)**

```javascript
const name = "Alice";
const age = 30;

// Old way
const message = "Hello, " + name + "! You are " + age + " years old.";

// Modern way (template literals)
const message = `Hello, ${name}! You are ${age} years old.`;
```

#### **Optional Chaining (?.)**

```javascript
const user = { profile: { name: "Alice" } };

// Without optional chaining (risky)
const name = user.profile.address.city;  // ❌ Error if address undefined!

// With optional chaining (safe)
const city = user.profile?.address?.city;  // undefined (no error)
```

#### **Nullish Coalescing (??)**

```javascript
const value = null;
const fallback = value ?? "default";  // "default"

const value2 = 0;
const result = value2 ?? "default";  // 0 (not "default", because 0 is valid)

// Compare with || (different behavior)
const result2 = value2 || "default";  // "default" (0 is falsy)
```

**✅ You now understand the JavaScript essentials needed for ai-langx/!**

---

## Chapter 3: LLM Fundamentals

### 3.1 What is an LLM?

**LLM = Large Language Model**

Think of it as:
- 📚 **A very smart autocomplete** that understands context
- 🧠 **A pattern matcher** trained on trillions of words
- 💬 **A conversationalist** that generates human-like text

**Popular LLMs**:
- **GPT-4** / **GPT-4o** / **GPT-4o-mini** (OpenAI) ← ai-langx/ uses this
- **Claude** (Anthropic)
- **Gemini** (Google)
- **Llama** (Meta, open-source)

### 3.2 How LLMs Work (Simple Explanation)

#### **Step 1: Training (Done by OpenAI)**

```
Internet Text (Books, Websites, Code)
           ↓
  Train Neural Network
           ↓
    Learned Patterns
"cat" often appears with "meow", "pet", "whiskers"
"Python" often appears with "code", "def", "import"
```

#### **Step 2: Inference (What You Do)**

```
Your Input: "The cat went to the"
           ↓
    LLM Predicts Next Word
      (based on patterns)
           ↓
Most Likely: "park" (30%), "store" (25%), "vet" (20%)
           ↓
    LLM Picks One: "park"
           ↓
Output: "The cat went to the park"
```

**Key Insight**: LLMs predict one word at a time, using context to decide what comes next.

### 3.3 Concept: Tokens

**What is a Token?**

A **token** is a piece of text (roughly 4 characters or ¾ of a word).

#### **Examples**

```
Sentence: "Hello, how are you?"
Tokens:   ["Hello", ",", " how", " are", " you", "?"]
Count:    6 tokens

Sentence: "LangChain is awesome!"
Tokens:   ["Lang", "Chain", " is", " awesome", "!"]
Count:    5 tokens

Word: "understanding"
Tokens: ["under", "standing"]  (2 tokens)

Word: "cat"
Tokens: ["cat"]  (1 token)
```

**Why Tokens Matter**:
- ✅ **Cost** - OpenAI charges per token (e.g., $0.15 per 1M input tokens)
- ✅ **Limits** - Models have max tokens (GPT-4o: 128k, GPT-4o-mini: 128k)
- ✅ **Performance** - More tokens = slower response

#### **Token Counting**

```javascript
// Rough estimate: 1 token ≈ 4 characters
const text = "Hello, world!";
const roughTokens = text.length / 4;  // ~3 tokens

// Actual: Use tiktoken library for accuracy
import { encoding_for_model } from "tiktoken";
const encoder = encoding_for_model("gpt-4o-mini");
const tokens = encoder.encode(text);
console.log(tokens.length);  // Exact count
```

#### **Real Example from ai-langx/**

```javascript
// LangSmith automatically tracks token usage
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const response = await llm.invoke("Add 500 for lunch");

// Response metadata includes:
// {
//   usage: {
//     prompt_tokens: 45,      // Input tokens
//     completion_tokens: 23,  // Output tokens
//     total_tokens: 68        // Total
//   }
// }

// Cost calculation
const inputCost = 45 * (0.15 / 1_000_000);   // $0.0000068
const outputCost = 23 * (0.60 / 1_000_000);  // $0.0000138
const totalCost = inputCost + outputCost;     // $0.0000206
```

### 3.4 Concept: Temperature (Creativity Control)

**Temperature controls randomness** in LLM responses.

#### **Temperature Scale**

```
Temperature: 0.0                    1.0                     2.0
             ↓                      ↓                       ↓
         Deterministic          Balanced                Creative
         (Same output)         (Varied)              (Unpredictable)
         
Best for:
- Classification         - Chatbots              - Creative writing
- Data extraction        - Assistants            - Brainstorming
- Calculations           - General use           - Story generation
```

#### **Example: Same Input, Different Temperatures**

**Input**: "The capital of France is"

```javascript
// Temperature = 0.0 (deterministic)
"The capital of France is Paris."  // Always same

// Temperature = 0.7 (balanced)
"The capital of France is Paris."
"France's capital is Paris."
"Paris is the capital of France."  // Varied phrasing

// Temperature = 1.5 (creative)
"The capital of France is Paris, the City of Light!"
"Paris - the romantic capital of France."
"France's iconic capital: Paris."  // More creative
```

#### **Real Example from ai-langx/**

```javascript
// File: src/graphs/intent-router.graph.js
// Classification (needs consistency)
const classifyLLM = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0  // ← Deterministic (same classification each time)
});

// File: src/agents/expense.agent.js
// Natural conversation (needs variety)
const agentLLM = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7  // ← Balanced (natural responses)
});

// File: src/rag/chains/qa.chain.js
// Factual answers (needs consistency)
const qaLLM = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3  // ← Low (stick to facts)
});
```

**💡 Rule**: Low temperature for factual tasks, higher for creative tasks.

### 3.5 Concept: Context Window

**Context window = How much text LLM can "see" at once.**

#### **Model Context Windows**

| Model | Context Window | Example Use |
|-------|---------------|-------------|
| GPT-4o-mini | 128,000 tokens | ~96,000 words (~300 pages) |
| GPT-4o | 128,000 tokens | Same |
| GPT-3.5-turbo | 16,000 tokens | ~12,000 words (~40 pages) |
| Claude 3 | 200,000 tokens | ~150,000 words (~500 pages) |

#### **What Fits in Context**

```
Context includes:
├─ System prompt (instructions)
├─ Conversation history (all previous messages)
├─ Tool schemas (function definitions)
├─ Retrieved documents (RAG)
└─ Current user message

Total must be < context window limit!
```

#### **Managing Context**

```javascript
// Problem: Long conversation (1000 messages = 50k tokens)
const history = [
  { role: "user", content: "Message 1" },
  { role: "assistant", content: "Response 1" },
  // ... 998 more messages ...
  { role: "user", content: "Message 1000" }
];

// Solution 1: Keep only recent messages
const recentHistory = history.slice(-10);  // Last 10 messages

// Solution 2: Summarize old messages
const summary = await llm.invoke(
  `Summarize this conversation:\n${oldMessages.join('\n')}`
);
const history = [
  { role: "system", content: summary },
  ...recentMessages
];

// Solution 3: Use ConversationSummaryMemory (LangChain does this)
```

#### **Real Example from ai-langx/**

```javascript
// File: src/graphs/intent-router.graph.js
const classifyIntent = async (state) => {
  let conversationContext = '';
  
  if (state.conversationHistory.length > 0) {
    // Keep only last 6 messages (prevent context overflow)
    const recentHistory = state.conversationHistory.slice(-6);
    //                                                 ^^^^^^^^
    //                    Limit to ~1500 tokens
    
    recentHistory.forEach(msg => {
      conversationContext += `${msg.role}: ${msg.content}\n`;
    });
  }
  
  // Use in prompt
  const prompt = `
Recent conversation:
${conversationContext}

Current message: "${state.userMessage}"

Classify intent...
`;
};
```

### 3.6 Concept: Messages (Chat Format)

**LLMs understand conversations as a list of messages.**

#### **Message Roles**

```javascript
const conversation = [
  // SYSTEM: Instructions (tells LLM its role)
  {
    role: "system",
    content: "You are a helpful expense tracking assistant."
  },
  
  // USER: User input
  {
    role: "user",
    content: "Add 500 for lunch today"
  },
  
  // ASSISTANT: LLM response
  {
    role: "assistant",
    content: "I'll add that expense for you.",
    tool_calls: [{ name: "create_expense", arguments: {...} }]
  },
  
  // TOOL: Tool execution result
  {
    role: "tool",
    tool_call_id: "call_123",
    content: '{"success": true, "expense": {...}}'
  },
  
  // ASSISTANT: Final response
  {
    role: "assistant",
    content: "✅ Added ₹500 for Food (lunch) on 2026-02-09."
  }
];
```

#### **Message Flow in Agent Loop**

```
1. USER: "Add 500 for lunch"
       ↓
2. ASSISTANT: [decides to call create_expense tool]
       ↓
3. TOOL: {"success": true, "expense": {...}}
       ↓
4. ASSISTANT: "✅ Added ₹500 for Food..."
       ↓
   (conversation ends)
```

#### **Real Example from ai-langx/**

```javascript
// File: src/agents/expense.agent.js
const prompt = ChatPromptTemplate.fromMessages([
  // System message
  ["system", `You are an AI expense tracking assistant...`],
  
  // Placeholder for conversation history
  ["placeholder", "{chat_history}"],
  
  // Current user input
  ["human", "{input}"],
  
  // Placeholder for agent's tool-calling scratchpad
  ["placeholder", "{agent_scratchpad}"]
]);

// When invoked, these get filled in:
const result = await agent.invoke({
  input: "Add 500 for lunch",
  chat_history: [
    { role: "user", content: "Previous message" },
    { role: "assistant", content: "Previous response" }
  ]
});
```

### 3.7 Concept: Function Calling (Tool Use)

**Function calling = LLM tells you which function to run with what arguments.**

#### **How It Works**

```
1. You give LLM:
   - Prompt: "Add 500 for lunch"
   - Functions: [create_expense, list_expenses, delete_expense]

2. LLM decides:
   - Function: create_expense
   - Arguments: { amount: 500, category: "Food", description: "lunch" }

3. You execute:
   - Call your function with those arguments
   - Get result: {"success": true}

4. You send result back to LLM:
   - LLM generates final response based on result
```

#### **Function Schema Example**

```javascript
const functions = [
  {
    name: "create_expense",
    description: "Add a new expense to the database",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Expense amount in rupees"
        },
        category: {
          type: "string",
          description: "Expense category (Food, Transport, etc.)"
        },
        description: {
          type: "string",
          description: "Optional description"
        }
      },
      required: ["amount", "category"]
    }
  }
];

// Send to OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Add 500 for lunch" }],
  functions: functions,
  function_call: "auto"  // Let LLM decide when to call
});

// LLM returns:
// {
//   role: "assistant",
//   content: null,
//   function_call: {
//     name: "create_expense",
//     arguments: '{"amount": 500, "category": "Food", "description": "lunch"}'
//   }
// }
```

#### **Real Example from ai-langx/** (LangChain Handles This!)

```javascript
// LangChain's StructuredTool automatically creates function schemas
class CreateExpenseTool extends StructuredTool {
  name = "create_expense";
  description = "Add a new expense";
  schema = z.object({  // Zod schema → OpenAI function schema
    amount: z.number().positive(),
    category: z.string()
  });
  
  async _call(args) {
    // LangChain validates args and calls this
    return await createExpense(args);
  }
}

// AgentExecutor handles entire loop automatically!
const agent = new AgentExecutor({ agent, tools: [createExpenseTool] });
const result = await agent.invoke({ input: "Add 500 for lunch" });
// ↑ LangChain does function calling, execution, and response generation
```

### 3.8 Concept: Embeddings (Vector Representations)

**Embeddings = Converting text into numbers (vectors) that capture meaning.**

#### **Why Embeddings?**

Computers can't understand text directly. Embeddings convert text to numbers:

```
Text: "cat"           → [0.12, -0.45, 0.87, ..., 0.34] (1536 numbers)
Text: "kitten"        → [0.15, -0.42, 0.89, ..., 0.31] (similar numbers!)
Text: "car"           → [0.67, 0.23, -0.11, ..., 0.78] (very different)
```

**Key Property**: Similar meanings → similar vectors!

#### **Similarity Calculation**

```
Vector 1: "cat"    → [0.1, 0.9, 0.2]
Vector 2: "kitten" → [0.2, 0.8, 0.3]
Vector 3: "car"    → [0.9, 0.1, 0.8]

Similarity (cat vs kitten): 0.95  (very similar!)
Similarity (cat vs car):    0.23  (not similar)
```

**Math**: Cosine similarity = dot product / (magnitude1 * magnitude2)

#### **Real Example: Semantic Search**

```javascript
// User asks: "What expenses did I have for food?"

// Step 1: Embed query
const queryVector = await embeddings.embedQuery(
  "What expenses did I have for food?"
);
// Result: [0.23, -0.45, 0.67, ..., 0.12] (1536 numbers)

// Step 2: Compare with stored document embeddings
const documents = [
  { text: "Groceries ₹1,250", embedding: [0.25, -0.43, 0.69, ...] },
  { text: "Taxi fare ₹300", embedding: [0.78, 0.12, -0.34, ...] },
  { text: "Restaurant ₹450", embedding: [0.22, -0.47, 0.71, ...] }
];

// Step 3: Calculate similarity
const scores = documents.map(doc => 
  cosineSimilarity(queryVector, doc.embedding)
);
// [0.98, 0.12, 0.96]  ← Groceries and Restaurant are relevant!

// Step 4: Return top matches
const results = documents
  .map((doc, i) => ({ doc, score: scores[i] }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

// Results:
// 1. "Groceries ₹1,250" (0.98)
// 2. "Restaurant ₹450" (0.96)
// 3. "Taxi fare ₹300" (0.12) ← Not food-related
```

#### **Real Example from ai-langx/**

```javascript
// File: src/rag/vectorstore/index.js
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small",  // 1536 dimensions
  openAIApiKey: process.env.OPENAI_API_KEY
});

// Embed documents (done once during upload)
const vectors = await embeddings.embedDocuments([
  "Expense 1: Groceries ₹1,250",
  "Expense 2: Taxi fare ₹300"
]);

// Embed query (done for each search)
const queryVector = await embeddings.embedQuery(
  "What food expenses do I have?"
);

// Search for similar
const results = await vectorStore.similaritySearch(query, 5);
// Returns top 5 documents with similar embeddings
```

### 3.9 Common LLM Limitations

**Understanding limitations helps you design better systems:**

#### **1. Hallucinations (Making Things Up)**

```javascript
// User: "What expenses are in my PDF?"
// LLM (if no PDF data): "You have ₹500 for groceries on March 5th"
//                       ↑ MADE UP! No PDF was provided

// Solution: Provide actual data (RAG)
const context = await retrieveDocuments(userId);
const prompt = `Based ONLY on this data:\n${context}\n\nAnswer: ...`;
```

#### **2. No Real-Time Knowledge**

```javascript
// User: "What's the current Bitcoin price?"
// LLM: "I don't have access to real-time data..."

// Solution: Use tools
class GetBitcoinPriceTool extends StructuredTool {
  async _call() {
    const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    return response.json();
  }
}
```

#### **3. Limited Math Ability**

```javascript
// User: "What's 12,345 * 67,890?"
// LLM: "approximately 838 million" (WRONG! It's 838,102,050)

// Solution: Use calculator tool
class CalculatorTool extends StructuredTool {
  async _call({ expression }) {
    return eval(expression);  // Proper math evaluation
  }
}
```

#### **4. Token Limits**

```javascript
// Problem: 500-page PDF (200k tokens) > 128k context window
// Solution: Chunk and retrieve only relevant parts (RAG)

const chunks = splitDocument(pdf, 1500);  // 1500 chars per chunk
await vectorStore.addDocuments(chunks);

// Later, retrieve only top 5 relevant chunks (~7.5k chars)
const relevant = await vectorStore.similaritySearch(query, 5);
```

**💡 Best Practices**:
- ✅ Use RAG for knowledge (don't rely on LLM memory)
- ✅ Use tools for real-time data/calculations
- ✅ Validate LLM outputs (don't blindly trust)
- ✅ Set temperature correctly for your use case

**✅ You now understand LLM fundamentals!**

---

## Chapter 4: Understanding AI Orchestration

### 4.1 What is AI Orchestration?

**AI Orchestration = Managing interactions between LLM, tools, and data.**

#### **Without Orchestration (Direct LLM Call)**

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Add 500 for lunch" }]
});

console.log(response.choices[0].message.content);
// "I'll add that expense for you." ← But it didn't actually add it!
```

**Problem**: LLM can't take actions (can't call APIs, access databases, etc.)

#### **With Orchestration (LangChain Agent)**

```javascript
const agent = new AgentExecutor({ agent, tools: [createExpenseTool] });
const result = await agent.invoke({ input: "Add 500 for lunch" });

// Behind the scenes:
// 1. LLM: "I should call create_expense with {amount: 500, category: 'Food'}"
// 2. Tool: Executes → Calls backend API → Returns result
// 3. LLM: "✅ Successfully added ₹500 for Food (lunch)"
```

**Orchestration handles**:
- ✅ Tool selection
- ✅ Tool execution
- ✅ Error handling
- ✅ Multi-step workflows
- ✅ Context management
- ✅ Response generation

### 4.2 Why LangChain/LangGraph?

**Option 1: Build from Scratch (Custom)**

```javascript
// You write everything manually
async function handleUserMessage(message) {
  // 1. Classify intent (manual LLM call)
  const intent = await classifyIntent(message);
  
  // 2. Route to handler
  if (intent === "create_expense") {
    // 3. Extract entities (manual LLM call)
    const entities = await extractEntities(message);
    
    // 4. Validate
    if (!entities.amount) return "Please provide amount";
    
    // 5. Call tool
    const result = await createExpense(entities);
    
    // 6. Generate response (manual LLM call)
    return await generateResponse(result);
  }
  // ... more intents ...
}

// Result: 100+ lines of code, hard to maintain
```

**Option 2: Use LangChain (Framework)**

```javascript
// Framework handles orchestration
const agent = await createExpenseAgent(authToken, context);
const result = await agent.invoke({ input: message });

// Result: 10 lines of code, battle-tested, maintainable
```

### 4.3 The Three Frameworks

#### **LangChain: The Toolbox**

**What**: Component library for building LLM applications

**Key Components**:
- **Models** - Talk to LLMs (OpenAI, Anthropic, etc.)
- **Prompts** - Template system
- **Tools** - Extend LLM capabilities
- **Agents** - Autonomous decision-making
- **Chains** - Sequential operations
- **Memory** - Conversation history
- **Retrievers** - Search documents

**Example**: Building an expense agent

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { StructuredTool } from "@langchain/core/tools";

// 1. Create LLM
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// 2. Create tools
const tools = [createExpenseTool, listExpensesTool];

// 3. Create agent
const agent = await createOpenAIToolsAgent({ llm, tools, prompt });

// 4. Create executor
const executor = new AgentExecutor({ agent, tools });

// 5. Use it!
const result = await executor.invoke({ input: "Add 500 for lunch" });
```

#### **LangGraph: The Workflow Engine**

**What**: Stateful workflow system (like a flowchart that executes)

**When to use**:
- ✅ Multi-step processes
- ✅ Conditional routing
- ✅ Parallel operations
- ✅ Human-in-the-loop
- ✅ Complex workflows

**Example**: Intent routing workflow

```javascript
import { StateGraph, START, END } from "@langchain/langgraph";

// 1. Define state schema
const StateSchema = z.object({
  userMessage: z.string(),
  intent: z.string().optional(),
  result: z.string().optional()
});

// 2. Create nodes (functions)
const classifyIntent = async (state) => {
  const intent = await llm.invoke(`Classify: ${state.userMessage}`);
  return { intent };
};

const handleExpense = async (state) => {
  const agent = await createExpenseAgent();
  const result = await agent.invoke({ input: state.userMessage });
  return { result };
};

// 3. Build workflow
const workflow = new StateGraph(StateSchema)
  .addNode("classify", classifyIntent)
  .addNode("handleExpense", handleExpense)
  .addEdge(START, "classify")
  .addConditionalEdges(
    "classify",
    (state) => state.intent,
    {
      "expense": "handleExpense",
      "other": END
    }
  )
  .addEdge("handleExpense", END);

// 4. Compile and execute
const app = workflow.compile();
const result = await app.invoke({ userMessage: "Add 500 for lunch" });
```

#### **LangSmith: The Observability Platform**

**What**: Debugging, monitoring, and testing platform

**Features**:
- ✅ **Automatic tracing** - See every LLM call, tool execution
- ✅ **Visual debugging** - Tree view of execution
- ✅ **Cost tracking** - Token usage and expenses
- ✅ **Performance** - Latency, success rate
- ✅ **Testing** - Datasets and evaluations
- ✅ **A/B testing** - Compare prompt variations

**Example**: Automatic tracing

```javascript
// Set environment variables
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_API_KEY = "ls_...";

// Normal code (no changes needed!)
const llm = new ChatOpenAI({
  tags: ['expense-tracker', 'user:123'],  // For filtering
  metadata: { sessionId: 'abc', userId: 123 }
});

const result = await llm.invoke("Add 500 for lunch");

// LangSmith automatically captures:
// - Input: "Add 500 for lunch"
// - Output: Response
// - Tokens: 234 (prompt: 180, completion: 54)
// - Cost: $0.000023
// - Latency: 1.2s
// - Model: gpt-4o-mini

// View in dashboard: https://smith.langchain.com
```

### 4.4 How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                          │
│              "Add 500 for lunch today"                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   LANGGRAPH                              │
│             (Workflow Orchestration)                     │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Node: Classify Intent                       │        │
│  │ Uses: LangChain ChatOpenAI                  │        │
│  │ Result: intent = "expense_operation"        │        │
│  └─────────────────┬──────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────┐        │
│  │ Node: Handle Expense Operation              │        │
│  │ Uses: LangChain AgentExecutor               │        │
│  │       ├─ LLM (ChatOpenAI)                   │        │
│  │       └─ Tools (StructuredTool)             │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
                     │
                     │ (All operations automatically traced)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   LANGSMITH                              │
│              (Observability Platform)                    │
│                                                          │
│  Trace: expense_creation_abc123                         │
│  ├─ LangGraph: IntentRouterGraph (3.5s)                │
│  │  ├─ Node: classifyIntent (1.2s)                     │
│  │  │  └─ ChatOpenAI: 234 tokens, $0.000023           │
│  │  └─ Node: handleExpense (2.3s)                      │
│  │     └─ AgentExecutor (2.3s)                         │
│  │        ├─ ChatOpenAI #1: Tool selection (0.8s)     │
│  │        ├─ Tool: create_expense (1.2s)               │
│  │        └─ ChatOpenAI #2: Response (0.3s)            │
│  │                                                      │
│  └─ Total: 568 tokens, $0.00012, 3.5s                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.5 AI-LangX Architecture Overview

```
ai-langx/
│
├── server.js                    (Express + LangSmith init)
│
├── src/
│   │
│   ├── config/
│   │   ├── langsmith.config.js  (Tracing setup)
│   │   └── llm.config.js        (LLM configuration)
│   │
│   ├── graphs/                  (LangGraph workflows)
│   │   ├── state.js             (Zod state schemas)
│   │   ├── intent-router.graph.js (Classification + routing)
│   │   └── reconciliation.graph.js (Multi-step reconciliation)
│   │
│   ├── agents/                  (LangChain agents)
│   │   └── expense.agent.js     (AgentExecutor for tools)
│   │
│   ├── tools/                   (LangChain StructuredTools)
│   │   ├── createExpense.tool.js
│   │   ├── listExpenses.tool.js
│   │   ├── modifyExpense.tool.js
│   │   ├── deleteExpense.tool.js
│   │   └── clearExpenses.tool.js
│   │
│   ├── rag/                     (LangChain RAG pipeline)
│   │   ├── loaders/             (PDFLoader)
│   │   ├── splitters/           (RecursiveCharacterTextSplitter)
│   │   ├── embeddings/          (OpenAIEmbeddings)
│   │   ├── vectorstore/         (MemoryVectorStore)
│   │   ├── retrievers/          (User-filtered retrieval)
│   │   └── chains/
│   │       └── qa.chain.js      (RetrievalQAChain)
│   │
│   ├── prompts/
│   │   └── system.prompt.js     (ChatPromptTemplate)
│   │
│   ├── routes/
│   │   ├── chat.js              (POST /ai/chat)
│   │   ├── upload.js            (POST /ai/upload)
│   │   └── reconcile.js         (POST /ai/reconcile)
│   │
│   ├── handlers/
│   │   └── rag.handler.js       (RAG Q&A logic)
│   │
│   └── utils/
│       ├── backendClient.js     (Axios backend API client)
│       └── dateNormalizer.js    (Date parsing)
│
└── data/
    └── vectorstore/             (Persisted embeddings)
```

### 4.6 Request Flow Example

**User**: "Add 500 for lunch today"

```
1. EXPRESS ROUTE (src/routes/chat.js)
   ├─ Validate JWT → Extract userId
   ├─ Parse request body
   └─ Call LangGraph workflow
   
2. LANGGRAPH: Intent Router (src/graphs/intent-router.graph.js)
   ├─ Node: classifyIntent
   │  ├─ LangChain ChatOpenAI
   │  └─ Returns: { intent: "expense_operation" }
   │
   └─ Conditional edge routes to:
      Node: handleExpenseOperation
      
3. LANGCHAIN: AgentExecutor (src/agents/expense.agent.js)
   ├─ AgentExecutor.invoke()
   ├─ LLM decides: Call create_expense tool
   ├─ Tool execution:
   │  ├─ StructuredTool: createExpense
   │  ├─ Zod validation
   │  └─ Backend API call
   ├─ LLM sees result
   └─ Generates response
   
4. LANGSMITH: Automatic Tracing
   ├─ Captures all LLM calls
   ├─ Captures tool executions
   ├─ Calculates token usage
   ├─ Tracks latency
   └─ Stores in dashboard
   
5. RESPONSE
   └─ Express sends JSON: { "reply": "✅ Added..." }
```

**✅ You now understand how the three frameworks work together!**

---

# Part II: LangChain Core

## Chapter 5: Models - Talking to LLMs

### 5.1 What Are Models in LangChain?

**Models = Interfaces to talk to LLMs** (OpenAI, Anthropic, Google, etc.)

LangChain provides **consistent APIs** across different providers:

```javascript
// All these have the same interface!
const openai = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const anthropic = new ChatAnthropic({ modelName: "claude-3" });
const google = new ChatGoogleGenerativeAI({ modelName: "gemini-pro" });

// Same method works for all
const response = await openai.invoke("Hello!");
```

### 5.2 Concept: Chat Models

**ChatModel = Conversational interface** (messages in, message out)

#### **Basic Usage**

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",  // Model selection
  temperature: 0.7,           // Creativity (0-2)
  maxTokens: 1000,            // Max response length
  openAIApiKey: process.env.OPENAI_API_KEY
});

// Single message
const response = await llm.invoke("What is 2+2?");
console.log(response.content);  // "2+2 equals 4."
```

#### **With Conversation History**

```javascript
const messages = [
  { role: "system", content: "You are a math tutor." },
  { role: "user", content: "What is 2+2?" },
  { role: "assistant", content: "2+2 equals 4." },
  { role: "user", content: "What about 3+3?" }
];

const response = await llm.invoke(messages);
console.log(response.content);  // "3+3 equals 6."
```

### 5.3 Model Configuration Options

#### **5.3.1 Model Name**

```javascript
// Different models, different capabilities
const mini = new ChatOpenAI({ modelName: "gpt-4o-mini" });
// ↑ Fast, cheap ($0.15/1M input tokens), good for most tasks

const standard = new ChatOpenAI({ modelName: "gpt-4o" });
// ↑ More capable, expensive ($2.50/1M input tokens), complex reasoning

const turbo = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
// ↑ Legacy, cheaper, 16k context window
```

**ai-langx/ uses**: `gpt-4o-mini` (best balance of speed, cost, quality)

#### **5.3.2 Temperature**

```javascript
// Deterministic (classification, data extraction)
const classifier = new ChatOpenAI({ temperature: 0 });

// Balanced (chatbots, assistants)
const assistant = new ChatOpenAI({ temperature: 0.7 });

// Creative (story writing, brainstorming)
const writer = new ChatOpenAI({ temperature: 1.5 });
```

**Real Example from ai-langx/**:

```javascript
// File: src/graphs/intent-router.graph.js
const classifyLLM = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0  // ← Must be consistent for classification
});

// File: src/agents/expense.agent.js
const agentLLM = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7  // ← Natural, varied responses
});
```

#### **5.3.3 Max Tokens**

```javascript
const llm = new ChatOpenAI({
  maxTokens: 500  // Limit response length
});

// Response will be cut off if exceeds 500 tokens
const response = await llm.invoke("Write a long essay about AI...");
```

**When to use**:
- ✅ Limit costs (fewer tokens = cheaper)
- ✅ Enforce brevity (short responses)
- ✅ Prevent runaway generation

#### **5.3.4 Top P (Nucleus Sampling)**

```javascript
const llm = new ChatOpenAI({
  topP: 0.9  // Sample from top 90% probability mass
});
```

**What it does**: Alternative to temperature for controlling randomness.
- `topP: 1.0` = Consider all tokens (most random)
- `topP: 0.1` = Consider only top 10% (most deterministic)

#### **5.3.5 Frequency Penalty**

```javascript
const llm = new ChatOpenAI({
  frequencyPenalty: 0.5  // Range: -2.0 to 2.0
});
```

**What it does**: Penalize repeated tokens (reduce repetition)
- `0` = No penalty (may repeat)
- `1` = Strong penalty (avoid repetition)
- `-1` = Encourage repetition (rare)

#### **5.3.6 Presence Penalty**

```javascript
const llm = new ChatOpenAI({
  presencePenalty: 0.5  // Range: -2.0 to 2.0
});
```

**What it does**: Encourage new topics (avoid same words)
- Similar to frequency penalty but for topic diversity

### 5.4 Concept: invoke(), batch(), stream()

#### **5.4.1 invoke() - Single Request**

```javascript
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// Synchronous-looking but actually async
const response = await llm.invoke("Hello!");
console.log(response.content);  // Response text
console.log(response.response_metadata.usage);  // Token usage
```

#### **5.4.2 batch() - Multiple Requests**

```javascript
const questions = [
  "What is 2+2?",
  "Capital of France?",
  "Largest planet?"
];

// Process all in parallel
const responses = await llm.batch(questions);

responses.forEach((response, i) => {
  console.log(`Q: ${questions[i]}`);
  console.log(`A: ${response.content}`);
});

// More efficient than 3 separate invoke() calls!
```

**Configuration**:

```javascript
const responses = await llm.batch(questions, {
  maxConcurrency: 3,  // Process 3 at a time (rate limiting)
  returnExceptions: true  // Don't fail all if one fails
});
```

#### **5.4.3 stream() - Real-time Streaming**

```javascript
const stream = await llm.stream("Tell me a story about a cat...");

// Print tokens as they arrive (like ChatGPT interface)
for await (const chunk of stream) {
  process.stdout.write(chunk.content);  // No newline
}

// Output appears word-by-word:
// "Once" → "upon" → "a" → "time" → "there" → "was" → ...
```

**Use case**: Chat interfaces where you want to show progress

**Potential ai-langx/ implementation**:

```javascript
// File: src/routes/chat.js (hypothetical)
router.post('/chat/stream', authMiddleware, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
  const stream = await llm.stream(req.body.message);
  
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
  }
  
  res.end();
});
```

### 5.5 Concept: Response Metadata

**Every LLM response includes metadata** (tokens, model, finish reason, etc.)

```javascript
const response = await llm.invoke("Hello!");

console.log(response);
// {
//   content: "Hello! How can I help you today?",
//   response_metadata: {
//     model: "gpt-4o-mini",
//     finish_reason: "stop",  // or "length", "tool_calls"
//     usage: {
//       prompt_tokens: 45,
//       completion_tokens: 23,
//       total_tokens: 68
//     },
//     system_fingerprint: "fp_abc123"
//   },
//   additional_kwargs: {},
//   tool_calls: []  // If LLM called tools
// }
```

#### **Finish Reasons**

- `"stop"` - Natural completion
- `"length"` - Hit maxTokens limit (response cut off)
- `"tool_calls"` - LLM wants to call a tool
- `"content_filter"` - OpenAI content filter triggered

### 5.6 Concept: Tags & Metadata (LangSmith)

**Add context to LLM calls for tracing/filtering**

```javascript
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  
  // Tags: Array of strings for categorization
  tags: [
    'expense-tracker',
    'transactional',
    'user:123',
    'env:production'
  ],
  
  // Metadata: Key-value pairs for detailed context
  metadata: {
    userId: 123,
    sessionId: 'session-abc',
    traceId: 'trace-xyz',
    feature: 'expense-creation',
    version: '2.0.1'
  }
});

const response = await llm.invoke("Add 500 for lunch");

// In LangSmith dashboard, filter by:
// - tags.includes("user:123")
// - metadata.feature == "expense-creation"
```

**Real Example from ai-langx/**:

```javascript
// File: src/config/langsmith.config.js
export const getTraceTags = (intent, userId) => {
  return [
    'expense-tracker',
    intent,  // 'transactional', 'rag_question', etc.
    `user:${userId}`,
    `env:${process.env.NODE_ENV || 'development'}`
  ];
};

export const getTraceMetadata = (traceId, userId, additionalMeta = {}) => {
  return {
    traceId,
    userId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...additionalMeta
  };
};

// File: src/llm/agent.js
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  tags: getTraceTags('transactional', context.userId),
  metadata: getTraceMetadata(context.traceId, context.userId)
});
```

### 5.7 Concept: Model Providers (OpenAI, Anthropic, Google)

**LangChain supports many providers with same interface**

#### **OpenAI**

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",  // or "gpt-4o", "gpt-3.5-turbo"
  openAIApiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID  // Optional
});
```

#### **Anthropic (Claude)**

```javascript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  modelName: "claude-3-sonnet-20240229",  // or "claude-3-opus"
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.7
});
```

#### **Google (Gemini)**

```javascript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  google APIKey: process.env.GOOGLE_API_KEY
});
```

#### **Switching Providers**

```javascript
// Easy to switch - same interface!
const getLLM = (provider = 'openai') => {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({ modelName: "gpt-4o-mini" });
    case 'anthropic':
      return new ChatAnthropic({ modelName: "claude-3-sonnet" });
    case 'google':
      return new ChatGoogleGenerativeAI({ modelName: "gemini-pro" });
  }
};

// Usage
const llm = getLLM('openai');
const response = await llm.invoke("Hello!");  // Works with any provider!
```

### 5.8 Concept: Callbacks

**Callbacks = Event handlers** for monitoring LLM calls

```javascript
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  callbacks: [{
    handleLLMStart: async (llm, prompts) => {
      console.log('LLM started');
      console.log('Prompts:', prompts);
    },
    handleLLMEnd: async (output) => {
      console.log('LLM finished');
      console.log('Output:', output);
      console.log('Tokens:', output.llmOutput.tokenUsage);
    },
    handleLLMError: async (error) => {
      console.error('LLM error:', error);
    }
  }]
});

const response = await llm.invoke("Hello!");

// Console output:
// LLM started
// Prompts: ["Hello!"]
// LLM finished
// Output: {...}
// Tokens: { promptTokens: 8, completionTokens: 12, totalTokens: 20 }
```

**Use cases**:
- ✅ Custom logging
- ✅ Metrics collection
- ✅ Cost tracking
- ✅ Performance monitoring

### 5.9 Real Example: LLM in AI-LangX

```javascript
// File: src/config/llm.config.js
import { ChatOpenAI } from "@langchain/openai";
import { getTraceTags, getTraceMetadata } from './langsmith.config.js';

export const createLLM = (options = {}) => {
  const {
    temperature = 0.7,
    tags = [],
    metadata = {},
    streaming = false
  } = options;
  
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature,
    streaming,
    openAIApiKey: process.env.OPENAI_API_KEY,
    
    // LangSmith tracing
    tags: ['expense-tracker', ...tags],
    metadata: {
      environment: process.env.NODE_ENV,
      ...metadata
    },
    
    // Configuration
    maxTokens: 2000,
    timeout: 30000  // 30 second timeout
  });
};

// Usage in agent
// File: src/agents/expense.agent.js
export const createExpenseAgent = async (authToken, context = {}) => {
  const llm = createLLM({
    temperature: 0.7,
    tags: getTraceTags('transactional', context.userId),
    metadata: getTraceMetadata(context.traceId, context.userId)
  });
  
  // ... rest of agent creation
};
```

### 5.10 Common Patterns

#### **Pattern 1: Retry Logic**

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  maxRetries: 3,  // Retry failed requests
  timeout: 30000   // 30 second timeout
});

// Automatically retries on:
// - Rate limit errors (429)
// - Server errors (500, 502, 503)
// - Network errors
```

#### **Pattern 2: Fallback Models**

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

const primaryLLM = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const fallbackLLM = new ChatAnthropic({ modelName: "claude-3-sonnet" });

const callWithFallback = async (message) => {
  try {
    return await primaryLLM.invoke(message);
  } catch (error) {
    console.warn('Primary LLM failed, using fallback');
    return await fallbackLLM.invoke(message);
  }
};
```

#### **Pattern 3: Cost Tracking**

```javascript
let totalTokens = 0;
let totalCost = 0;

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  callbacks: [{
    handleLLMEnd: async (output) => {
      const tokens = output.llmOutput.tokenUsage;
      totalTokens += tokens.totalTokens;
      
      // GPT-4o-mini pricing (as of Feb 2026)
      const inputCost = tokens.promptTokens * (0.15 / 1_000_000);
      const outputCost = tokens.completionTokens * (0.60 / 1_000_000);
      totalCost += inputCost + outputCost;
      
      console.log(`Tokens: ${totalTokens}, Cost: $${totalCost.toFixed(6)}`);
    }
  }]
});
```

**✅ You now understand LangChain Models!**

---

## Chapter 6: Prompts - Instructing LLMs

### 6.1 What Are Prompts?

**Prompt = Instructions you give to an LLM**

Think of prompts like talking to a very literal friend:
- 😐 **Vague prompt**: "Help with money" → Confusing response
- 😊 **Clear prompt**: "Add ₹500 expense for lunch today" → Useful response

### 6.2 Why Use Prompt Templates?

**Problem**: Hardcoded prompts are messy

```javascript
// ❌ BAD: Hardcoded, hard to maintain
const prompt = `You are an expense assistant. The user said: "${userMessage}". Help them.`;
const response = await llm.invoke(prompt);
```

**Solution**: Reusable templates

```javascript
// ✅ GOOD: Template with variables
const template = `You are an expense assistant. The user said: "{userMessage}". Help them.`;
const prompt = template.replace('{userMessage}', userMessage);
const response = await llm.invoke(prompt);
```

**Even better**: LangChain PromptTemplate

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

const template = PromptTemplate.fromTemplate(
  "You are an expense assistant. The user said: {userMessage}. Help them."
);

const prompt = await template.format({ userMessage: "Add 500 for lunch" });
const response = await llm.invoke(prompt);
```

### 6.3 Concept: PromptTemplate

#### **Basic Usage**

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

const template = new PromptTemplate({
  template: "Tell me a {adjective} joke about {topic}.",
  inputVariables: ["adjective", "topic"]
});

const prompt = await template.format({
  adjective: "funny",
  topic: "cats"
});

console.log(prompt);
// "Tell me a funny joke about cats."
```

#### **Shorthand Syntax**

```javascript
const template = PromptTemplate.fromTemplate(
  "Tell me a {adjective} joke about {topic}."
);
// Automatically detects variables: [adjective, topic]
```

#### **With Validation**

```javascript
const template = new PromptTemplate({
  template: "Translate to {language}: {text}",
  inputVariables: ["language", "text"]
});

// ❌ Error: Missing 'text' variable
await template.format({ language: "French" });

// ✅ Works
await template.format({ language: "French", text: "Hello" });
```

#### **Real Example from ai-langx/** (Hypothetical)

```javascript
// File: src/prompts/classification.prompt.js
export const classificationPrompt = PromptTemplate.fromTemplate(`
You are an intent classifier for an expense tracking application.

Classify the user's message into ONE of these intents:
1. expense_operation - Create, list, modify, or delete expenses
2. rag_question - Questions about uploaded PDF documents
3. reconciliation - Sync or reconcile expenses with documents
4. general_chat - Greetings, help requests, or general conversation

User message: "{userMessage}"

Return JSON:
{{"intent": "expense_operation", "confidence": 0.95, "reasoning": "User wants to add an expense"}}
`);

// Usage
const prompt = await classificationPrompt.format({
  userMessage: "Add 500 for lunch"
});
```

### 6.4 Concept: ChatPromptTemplate

**ChatPromptTemplate = Templates for conversational messages**

#### **Message Types**

```javascript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const template = ChatPromptTemplate.fromMessages([
  // SYSTEM: LLM's role/instructions
  ["system", "You are a helpful expense assistant."],
  
  // HUMAN: User input
  ["human", "Add {amount} for {category}"],
  
  // AI: Previous LLM response (for context)
  ["ai", "I'll add that expense for you."],
  
  // HUMAN: Follow-up
  ["human", "Also add {amount2} for {category2}"]
]);

const messages = await template.formatMessages({
  amount: 500,
  category: "lunch",
  amount2: 300,
  category3: "taxi"
});
```

#### **With Placeholders** (Dynamic Messages)

```javascript
const template = ChatPromptTemplate.fromMessages([
  ["system", "You are an expense assistant."],
  
  // Placeholder for conversation history (variable number of messages)
  ["placeholder", "{chat_history}"],
  
  // Current user input
  ["human", "{input}"]
]);

const messages = await template.formatMessages({
  chat_history: [
    { role: "user", content: "What's my total?" },
    { role: "assistant", content: "Your total is ₹1,500." }
  ],
  input: "Add 500 for lunch"
});
```

#### **Real Example from ai-langx/**

```javascript
// File: src/agents/expense.agent.js
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  // System instructions
  ["system", `You are an AI expense tracking assistant.

Your capabilities:
- Create expenses (amount, category, description, date)
- List/filter expenses (by date, category, amount)
- Modify existing expenses
- Delete expenses
- Clear all expenses for a date range

Important rules:
- Always use tools to perform actions (never fake results)
- Confirm amounts and categories with user if unclear
- Use ISO date format (YYYY-MM-DD) - Today is {currentDate}
- Be concise and helpful`],
  
  // Conversation history (dynamic)
  ["placeholder", "{chat_history}"],
  
  // Current user input
  ["human", "{input}"],
  
  // Agent scratchpad (for tool calling)
  ["placeholder", "{agent_scratchpad}"]
]);

// Usage
const agent = await createOpenAIToolsAgent({
  llm,
  tools,
  prompt  // Uses this template
});

const result = await executor.invoke({
  input: "Add 500 for lunch",
  chat_history: [],  // Empty for new conversation
  currentDate: "2026-02-09"
});
```

### 6.5 Concept: Few-Shot Prompting

**Few-shot = Providing examples to guide LLM**

#### **Without Examples (Zero-Shot)**

```javascript
const template = PromptTemplate.fromTemplate(`
Extract the expense amount and category.

Input: "{input}"
Output:`);

// Might work, might not - LLM has to guess format
```

#### **With Examples (Few-Shot)**

```javascript
const template = PromptTemplate.fromTemplate(`
Extract the expense amount and category.

Examples:
Input: "I spent 500 on groceries"
Output: {{"amount": 500, "category": "Groceries"}}

Input: "Paid 1200 for rent"
Output: {{"amount": 1200, "category": "Rent"}}

Input: "Taxi fare was 300"
Output: {{"amount": 300, "category": "Transport"}}

Now extract from:
Input: "{input}"
Output:`);

// Much more consistent! LLM sees pattern
```

#### **FewShotPromptTemplate** (Automated)

```javascript
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

// Define examples
const examples = [
  { input: "I spent 500 on groceries", output: '{"amount": 500, "category": "Groceries"}' },
  { input: "Paid 1200 for rent", output: '{"amount": 1200, "category": "Rent"}' },
  { input: "Taxi fare was 300", output: '{"amount": 300, "category": "Transport"}' }
];

// Example template (how to format each example)
const exampleTemplate = PromptTemplate.fromTemplate(`
Input: {input}
Output: {output}`);

// Few-shot template
const fewShotTemplate = new FewShotPromptTemplate({
  examples,
  examplePrompt: exampleTemplate,
  prefix: "Extract the expense amount and category.\n\nExamples:",
  suffix: "\nNow extract from:\nInput: {input}\nOutput:",
  inputVariables: ["input"]
});

const prompt = await fewShotTemplate.format({
  input: "I bought coffee for 120"
});
```

### 6.6 Concept: Example Selectors

**Problem**: Too many examples → exceed token limit

**Solution**: Dynamically select relevant examples

#### **Semantic Similarity Selector**

```javascript
import { SemanticSimilarityExampleSelector } from "@langchain/core/example_selectors";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const examples = [
  { input: "I spent 500 on groceries", output: '{"amount": 500, "category": "Food"}' },
  { input: "Paid 1200 for rent", output: '{"amount": 1200, "category": "Housing"}' },
  { input: "Taxi fare was 300", output: '{"amount": 300, "category": "Transport"}' },
  { input: "Movie tickets 600", output: '{"amount": 600, "category": "Entertainment"}' },
  { input: "Internet bill 800", output: '{"amount": 800, "category": "Utilities"}' }
];

// Create selector
const selector = await SemanticSimilarityExampleSelector.fromExamples(
  examples,
  new OpenAIEmbeddings(),
  MemoryVectorStore,
  { k: 2 }  // Select top 2 most similar
);

// Select examples for specific input
const selectedExamples = await selector.selectExamples({
  input: "Bus ticket cost 50"
});

// Returns: [
//   { input: "Taxi fare was 300", output: '{"amount": 300, "category": "Transport"}' },
//   { input: "Movie tickets 600", output: '{"amount": 600, "category": "Entertainment"}' }
// ]
// ↑ Most similar to transportation/tickets
```

### 6.7 Concept: Partial Variables

**Partial variables = Pre-fill some template variables**

```javascript
const template = PromptTemplate.fromTemplate(`
Current date: {date}
Current user: {user}

User message: {message}
`);

// Partially fill date and user (constant per session)
const partialTemplate = await template.partial({
  date: "2026-02-09",
  user: "User #123"
});

// Now only need to provide message
const prompt = await partialTemplate.format({
  message: "Add 500 for lunch"
});

// Result:
// Current date: 2026-02-09
// Current user: User #123
//
// User message: Add 500 for lunch
```

**Use case**: Session-specific data (date, userId, etc.)

**Real Example from ai-langx/** (Hypothetical)

```javascript
// File: src/prompts/system.prompt.js
const systemPromptBase = ChatPromptTemplate.fromMessages([
  ["system", `You are an expense assistant for {userName}.
Today's date: {currentDate}.
User's currency: {currency}.

{userMessage}`]
]);

// In request handler
export const createSessionPrompt = (user) => {
  return systemPromptBase.partial({
    userName: user.name,
    currentDate: new Date().toISOString().split('T')[0],
    currency: user.currency || 'INR'
  });
};

// Usage
const prompt = createSessionPrompt({ name: "Alice", currency: "USD" });
const messages = await prompt.format({ userMessage: "Add 500 for lunch" });
```

### 6.8 Concept: Prompt Composition

**Compose prompts from smaller pieces**

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

// Reusable pieces
const systemInstructions = PromptTemplate.fromTemplate(`
You are a helpful {role} assistant.`);

const taskDescription = PromptTemplate.fromTemplate(`
Your task is to {task}.`);

const userInput = PromptTemplate.fromTemplate(`
User: {input}`);

// Compose
const fullPrompt = async (role, task, input) => {
  const parts = await Promise.all([
    systemInstructions.format({ role }),
    taskDescription.format({ task }),
    userInput.format({ input })
  ]);
  return parts.join('\n\n');
};

const prompt = await fullPrompt(
  "expense tracking",
  "help users manage their finances",
  "Add 500 for lunch"
);
```

### 6.9 Concept: PipelinePromptTemplate

**Chain prompts together**

```javascript
import { PipelinePromptTemplate, PromptTemplate } from "@langchain/core/prompts";

const fullPrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    {
      name: "role",
      prompt: PromptTemplate.fromTemplate("You are a {role} assistant.")
    },
    {
      name: "task",
      prompt: PromptTemplate.fromTemplate("Your task: {task}.")
    }
  ],
  finalPrompt: PromptTemplate.fromTemplate(`
{role}
{task}

User: {input}
`),
  inputVariables: ["role", "task", "input"]
});

const prompt = await fullPrompt.format({
  role: "expense tracking",
  task: "help manage finances",
  input: "Add 500"
});
```

### 6.10 Best Practices

#### **1. Be Specific**

```javascript
// ❌ Vague
"Help with expenses"

// ✅ Specific
"You are an AI expense tracking assistant. Help users create, list, modify, and delete expenses. Always confirm amounts and categories."
```

#### **2. Provide Context**

```javascript
// ❌ No context
"User: Add 500"

// ✅ With context
`Date: 2026-02-09
User: Alice (ID: 123)
Previous total: ₹2,000

User: Add 500 for lunch`
```

#### **3. Show Examples**

```javascript
// ❌ No examples
"Extract amount and category"

// ✅ With examples
`Extract amount and category.

Examples:
"500 for lunch" → {"amount": 500, "category": "Food"}
"taxi 300" → {"amount": 300, "category": "Transport"}

Input: {userMessage}
Output:`
```

#### **4. Set Constraints**

```javascript
// ❌ No constraints
"Answer the question"

// ✅ With constraints
`Answer based ONLY on the provided context.
If the answer is not in the context, say "I don't have that information."
Keep responses under 100 words.`
```

#### **5. Use Templates**

```javascript
// ❌ Hardcoded
const prompt = `You are an assistant. User said: "${userMessage}". Help them.`;

// ✅ Template
const template = PromptTemplate.fromTemplate(
  "You are an assistant. User said: {userMessage}. Help them."
);
```

### 6.11 Real Example: Complete Prompt System

```javascript
// File: src/prompts/system.prompt.js
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const getSystemPromptText = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `You are an AI expense tracking assistant powered by LangChain.

CURRENT CONTEXT:
- Date: ${currentDate}
- System: ai-langx expense tracker
- Backend: REST API (you call tools to interact)

YOUR CAPABILITIES:
1. Create Expense: Add new expense with amount, category, description, date
2. List Expenses: Filter by date range, category, amount
3. Modify Expense: Update existing expense details
4. Delete Expense: Remove specific expense
5. Clear Expenses: Remove all expenses in date range

IMPORTANT RULES:
✅ ALWAYS use tools (never fabricate results)
✅ Confirm if user input is ambiguous
✅ Use ISO date format (YYYY-MM-DD)
✅ Today is ${currentDate} - use this for "today", "yesterday"
✅ Be concise but friendly
✅ If tool fails, explain error clearly

EXAMPLE INTERACTIONS:
User: "Add 500 for lunch"
You: [Call create_expense(amount=500, category="Food", description="lunch", date="${currentDate}")]
You: "✅ Added ₹500 for Food (lunch) on ${currentDate}."

User: "Show expenses from last week"
You: [Call list_expenses(dateFrom="2026-02-02", dateTo="${currentDate}")]
You: [Present results in readable format]

User: "Delete expense 123"
You: [Call delete_expense(id=123)]
You: "✅ Deleted expense #123."

Let's help the user manage their expenses effectively!`;
};

export const createAgentPrompt = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", getSystemPromptText()],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);
};
```

**✅ You now understand LangChain Prompts!**

---

*[Document continues with remaining chapters 7-44 covering all 270+ concepts...]*

*Due to length constraints, I'll provide a note that this is a comprehensive 20,000+ line document. The full version would continue with:*

- Chapter 7: Tools - Extending LLM Capabilities
- Chapter 8: Agents - Autonomous Decision Making
- Chapter 9-16: Chains, Memory, RAG Pipeline
- Chapter 17-23: Advanced LangChain (LCEL, Retrievers, Caching)
- Chapter 24-32: Complete LangGraph coverage
- Chapter 33-40: Complete LangSmith coverage
- Chapter 41-44: Integration, Best Practices, Troubleshooting

**Each chapter includes**:
- Detailed concept explanations
- Code examples from ai-langx/
- Hypothetical implementations for missing concepts
- Beginner-friendly analogies
- Common pitfalls and solutions
- Real-world use cases

---

## How to Convert to PDF

Save this file and convert using one of these methods:

### Method 1: Pandoc (Best Quality)
```bash
pandoc LANGCHAIN_LANGGRAPH_LANGSMITH_COMPLETE_GUIDE.md -o guide.pdf --pdf-engine=xelatex
```

### Method 2: VS Code Extension
1. Install "Markdown PDF" extension
2. Right-click file → "Markdown PDF: Export (pdf)"

###Method 3: Online Converter
- Upload to: https://www.markdowntopdf.com/
- Download generated PDF

---

**Note**: This is Chapter 1-6 of a comprehensive 44-chapter guide. The complete document would be ~20,000 lines covering all 270+ concepts with detailed examples from ai-langx/. Would you like me to continue with the remaining chapters?
