# Part 5: LangGraph
## StateGraph, Workflows & Multi-Agent Systems

**Prerequisites**: Complete Parts 1-4  
**Concepts Covered**: 40+  
**Reading Time**: 6-7 hours  
**Hands-On**: Build complete multi-step workflow system

---

## Table of Contents

24. [StateGraph Fundamentals](#chapter-24-stategraph-fundamentals)
25. [Nodes - State Transformers](#chapter-25-nodes---state-transformers)
26. [Edges - Connecting the Flow](#chapter-26-edges---connecting-the-flow)
27. [State Management](#chapter-27-state-management)
28. [Conditional Routing](#chapter-28-conditional-routing)
29. [Parallel Execution](#chapter-29-parallel-execution)
30. [Persistence & Checkpoints](#chapter-30-persistence--checkpoints)
31. [Streaming & Real-Time Updates](#chapter-31-streaming--real-time-updates)
32. [Advanced Patterns](#chapter-32-advanced-patterns)

---

## Chapter 24: StateGraph Fundamentals

### 24.1 What Is LangGraph?

**LangGraph = Framework for building stateful, multi-step workflows** (beyond simple chains)

Think of LangGraph as:
- 🔄 **State Machine**: Defined states that transition based on logic
- 📊 **Directed Graph**: Nodes (operations) + Edges (transitions)
- 🔁 **Loops & Cycles**: Unlike chains (linear), graphs can loop back
- 🎯 **Multi-Agent**: Coordinate multiple agents/tools/processes

#### **Why LangGraph? Limitations of Chains**

**Problem with Chains** (Sequential only):

```javascript
// Chain: Always goes A → B → C → D
const chain = stepA.pipe(stepB).pipe(stepC).pipe(stepD);

// ❌ Can't go back to B after C
// ❌ Can't skip C based on B's output
// ❌ Can't run B and C in parallel
// ❌ Can't loop until condition met
```

**Solution with LangGraph** (Flexible flow):

```javascript
const graph = new StateGraph(schema);
graph.addNode("A", stepA);
graph.addNode("B", stepB);
graph.addNode("C", stepC);
graph.addNode("D", stepD);

// Conditional: B → C or B → D based on state
graph.addConditionalEdges("B", (state) => 
  state.needsValidation ? "C" : "D"
);

// Loop: C → B until valid
graph.addEdge("C", "B");

// Parallel: Run B and C simultaneously
graph.addEdge(START, "B");
graph.addEdge(START, "C");
```

### 24.2 Core Concepts

#### **Graph = Nodes + Edges + State**

```
┌─────────────────────────────────────────┐
│           STATE (Shared Data)           │
│  { input: "...", result: null }         │
└─────────────────────────────────────────┘
                   ↓
         ┌─────────────────┐
         │   START Node    │  ← Entry point
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │   Node A        │  ← Transforms state
         │  (Process Input)│
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │   Node B        │  ← Transforms state
         │  (Validation)   │
         └────────┬────────┘
                  ↓
            [Condition?]  ← Conditional edge
           /            \
    Valid /              \ Invalid
         /                \
┌─────────────┐    ┌─────────────┐
│   Node C    │    │   Node D    │
│  (Success)  │    │   (Retry)   │
└──────┬──────┘    └──────┬──────┘
       ↓                   ↓
  ┌─────────────┐     Loop back
  │  END Node   │
  └─────────────┘
```

### 24.3 Basic StateGraph Setup

```javascript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// 1. Define state schema (what data flows through graph)
const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  output: Annotation<string>(),
  steps: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update]  // Accumulator
  })
});

// 2. Create graph
const graph = new StateGraph(StateAnnotation);

// 3. Define nodes (state transformation functions)
const processInput = async (state) => {
  console.log("[Node: processInput] Input:", state.input);
  return {
    output: state.input.toUpperCase(),
    steps: ["processed"]
  };
};

const validateOutput = async (state) => {
  console.log("[Node: validateOutput] Output:", state.output);
  const isValid = state.output.length > 0;
  return {
    steps: [isValid ? "validated" : "validation_failed"]
  };
};

// 4. Add nodes to graph
graph.addNode("process", processInput);
graph.addNode("validate", validateOutput);

// 5. Define edges (flow between nodes)
graph.addEdge(START, "process");  // Start → process
graph.addEdge("process", "validate");  // process → validate
graph.addEdge("validate", END);  // validate → END

// 6. Compile graph
const workflow = graph.compile();

// 7. Execute
const result = await workflow.invoke({
  input: "hello world",
  steps: []
});

console.log(result);
// {
//   input: "hello world",
//   output: "HELLO WORLD",
//   steps: ["processed", "validated"]
// }
```

### 24.4 State Schema with Annotation

**Annotation = Type-safe state definition** (replaces old StateGraphArgs)

#### **Basic Types**

```javascript
import { Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  // String field
  name: Annotation<string>(),
  
  // Number field
  age: Annotation<number>(),
  
  // Boolean field
  isValid: Annotation<boolean>(),
  
  // Array field
  items: Annotation<string[]>(),
  
  // Object field
  metadata: Annotation<{ [key: string]: any }>(),
  
  // Optional field
  description: Annotation<string | undefined>()
});
```

#### **Default Values**

```javascript
const StateAnnotation = Annotation.Root({
  counter: Annotation<number>({
    default: () => 0  // Default value
  }),
  
  items: Annotation<string[]>({
    default: () => []  // Empty array by default
  })
});
```

#### **Reducers (How to Merge Updates)**

```javascript
const StateAnnotation = Annotation.Root({
  // Append to array
  messages: Annotation<Message[]>({
    reducer: (existing, update) => [...existing, ...update]
  }),
  
  // Sum numbers
  totalCost: Annotation<number>({
    reducer: (existing, update) => existing + update,
    default: () => 0
  }),
  
  // Replace (default behavior)
  status: Annotation<string>({
    reducer: (existing, update) => update  // Just replace
  }),
  
  // Merge objects
  metadata: Annotation<Record<string, any>>({
    reducer: (existing, update) => ({ ...existing, ...update })
  })
});
```

**How reducers work**:

```javascript
// Initial state
let state = { messages: [], totalCost: 0 };

// Node 1 returns
{ messages: [{ role: "user", content: "Hi" }], totalCost: 10 }
// State after reducer: { messages: [{ role: "user", content: "Hi" }], totalCost: 10 }

// Node 2 returns
{ messages: [{ role: "assistant", content: "Hello" }], totalCost: 5 }
// State after reducer: 
// {
//   messages: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }],  ← Appended
//   totalCost: 15  ← Summed
// }
```

### 24.5 Graph Compilation

```javascript
// Basic compilation
const workflow = graph.compile();

// With checkpointer (persistence)
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const workflow = graph.compile({ checkpointer });

// With interrupts (human-in-loop)
const workflow = graph.compile({
  checkpointer,
  interruptBefore: ["approval_node"],  // Pause before this node
  interruptAfter: ["data_fetch_node"]  // Pause after this node
});
```

### 24.6 Invoking the Graph

#### **Simple Invoke**

```javascript
const result = await workflow.invoke({
  input: "Hello"
});

console.log(result);
// Final state after all nodes executed
```

#### **With Configuration**

```javascript
const result = await workflow.invoke(
  { input: "Hello" },
  {
    configurable: {
      thread_id: "conversation-123",  // For persistence
      user_id: 456,  // Custom config
      run_name: "expense_processing"  // LangSmith trace name
    },
    recursionLimit: 25  // Max nodes to execute (default: 25)
  }
);
```

### 24.7 Real Example: Simple Expense Validator

**Goal**: Validate expense before saving

```javascript
// File: src/graphs/expenseValidator.graph.js
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// State schema
const ValidationStateAnnotation = Annotation.Root({
  description: Annotation<string>(),
  amount: Annotation<number>(),
  category: Annotation<string>(),
  errors: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  isValid: Annotation<boolean>({
    default: () => false
  })
});

// Nodes
const validateAmount = async (state) => {
  const errors = [];
  
  if (state.amount <= 0) {
    errors.push("Amount must be positive");
  }
  
  if (state.amount > 100000) {
    errors.push("Amount exceeds limit (₹100,000)");
  }
  
  return { errors };
};

const validateCategory = async (state) => {
  const validCategories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Healthcare", "Education", "Other"];
  const errors = [];
  
  if (!validCategories.includes(state.category)) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(", ")}`);
  }
  
  return { errors };
};

const validateDescription = async (state) => {
  const errors = [];
  
  if (!state.description || state.description.trim().length === 0) {
    errors.push("Description is required");
  }
  
  if (state.description.length > 500) {
    errors.push("Description too long (max 500 characters)");
  }
  
  return { errors };
};

const finalizeValidation = async (state) => {
  return {
    isValid: state.errors.length === 0
  };
};

// Build graph
const graph = new StateGraph(ValidationStateAnnotation);

graph.addNode("validate_amount", validateAmount);
graph.addNode("validate_category", validateCategory);
graph.addNode("validate_description", validateDescription);
graph.addNode("finalize", finalizeValidation);

// All validations run in parallel (covered in chapter 29)
graph.addEdge(START, "validate_amount");
graph.addEdge(START, "validate_category");
graph.addEdge(START, "validate_description");

// All converge to finalize
graph.addEdge("validate_amount", "finalize");
graph.addEdge("validate_category", "finalize");
graph.addEdge("validate_description", "finalize");

graph.addEdge("finalize", END);

// Compile
export const expenseValidatorGraph = graph.compile();

// Usage
const result = await expenseValidatorGraph.invoke({
  description: "Lunch at restaurant",
  amount: 500,
  category: "Food",
  errors: []
});

console.log(result);
// {
//   description: "Lunch at restaurant",
//   amount: 500,
//   category: "Food",
//   errors: [],
//   isValid: true
// }

// Invalid example
const invalid = await expenseValidatorGraph.invoke({
  description: "",
  amount: -100,
  category: "InvalidCategory",
  errors: []
});

console.log(invalid);
// {
//   description: "",
//   amount: -100,
//   category: "InvalidCategory",
//   errors: [
//     "Amount must be positive",
//     "Invalid category. Must be one of: Food, Transport, ...",
//     "Description is required"
//   ],
//   isValid: false
// }
```

**✅ You now understand StateGraph Fundamentals!**

---

## Chapter 25: Nodes - State Transformers

### 25.1 What Are Nodes?

**Node = Function that transforms state** (receives state, returns updates)

Think of nodes as:
- 🔧 **State Transformers**: Take state in, produce state out
- 📦 **Operations**: LLM calls, tool executions, data processing
- ⚡ **Async**: Can be async (API calls, database queries)

### 25.2 Node Function Signature

```javascript
// Basic node
const myNode = async (state) => {
  // state: Current graph state (read-only, don't mutate!)
  
  // Do work
  const result = await someOperation(state.input);
  
  // Return partial state updates (merged via reducers)
  return {
    output: result,
    steps: ["myNode completed"]
  };
};
```

**Important**:
- ✅ Return only fields you want to update
- ✅ Don't modify `state` directly (immutable)
- ✅ Return partial updates (graph merges them)
- ❌ Don't return entire state

### 25.3 Node with Configuration

**Access runtime config** (auth tokens, user IDs, etc.)

```javascript
const myNode = async (state, config) => {
  // config.configurable: Runtime configuration
  const authToken = config.configurable.authToken;
  const userId = config.configurable.userId;
  
  // Use in API calls
  const result = await backendClient.get('/data', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  return { data: result.data };
};

// Invoke with config
await workflow.invoke(
  { input: "..." },
  {
    configurable: {
      authToken: "jwt-token-here",
      userId: 123
    }
  }
);
```

### 25.4 Node Types

#### **1. LLM Nodes** (Call language model)

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llmNode = async (state) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
  
  const response = await llm.invoke([
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: state.userMessage }
  ]);
  
  return {
    aiResponse: response.content
  };
};
```

#### **2. Tool Execution Nodes**

```javascript
const toolNode = async (state, config) => {
  const tool = new CreateExpenseTool(
    config.configurable.authToken,
    { userId: config.configurable.userId }
  );
  
  const result = await tool._call({
    amount: state.amount,
    category: state.category,
    description: state.description
  });
  
  return {
    toolResult: JSON.parse(result)
  };
};
```

#### **3. Data Processing Nodes**

```javascript
const processDataNode = async (state) => {
  // Transform data
  const processed = state.rawData.map(item => ({
    ...item,
    normalized: normalizeValue(item.value)
  }));
  
  // Calculate statistics
  const total = processed.reduce((sum, item) => sum + item.normalized, 0);
  
  return {
    processedData: processed,
    total
  };
};
```

#### **4. API Call Nodes**

```javascript
const fetchDataNode = async (state, config) => {
  const authToken = config.configurable.authToken;
  
  try {
    const response = await fetch('https://api.example.com/expenses', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    return {
      expenses: data.expenses,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: error.message,
      expenses: []
    };
  }
};
```

#### **5. Validation Nodes**

```javascript
const validationNode = async (state) => {
  const errors = [];
  
  // Validate fields
  if (!state.email || !state.email.includes('@')) {
    errors.push("Invalid email");
  }
  
  if (!state.password || state.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  return {
    errors,
    isValid: errors.length === 0
  };
};
```

### 25.5 Node Error Handling

**Nodes should handle errors gracefully**

```javascript
const robustNode = async (state, config) => {
  try {
    // Risky operation
    const result = await riskyAPICall(state.input);
    
    return {
      result,
      status: "success"
    };
    
  } catch (error) {
    // Log error
    console.error("[Node Error]", error);
    
    // Return error state (don't throw!)
    return {
      error: error.message,
      status: "error",
      result: null
    };
  }
};

// Downstream node can check status
const nextNode = async (state) => {
  if (state.status === "error") {
    // Handle error case
    return { finalResult: `Failed: ${state.error}` };
  }
  
  // Process success case
  return { finalResult: processResult(state.result) };
};
```

### 25.6 Real Example: ai-langx/ Intent Classification Node

```javascript
// File: src/graphs/nodes/classifyIntent.node.js
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

export const classifyIntentNode = async (state, config) => {
  const { userMessage } = state;
  const { userId, traceId } = config.configurable;
  
  try {
    // Output schema
    const schema = z.object({
      intent: z.enum(["transactional", "qa", "reconciliation", "clarification"]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string()
    });
    
    const parser = StructuredOutputParser.fromZodSchema(schema);
    
    // LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      tags: ["intent-classification", `user-${userId}`],
      metadata: { traceId, feature: "intent-router" }
    });
    
    // Prompt
    const prompt = `Classify user intent:

User message: "${userMessage}"

Intent categories:
1. transactional: Create, modify, delete, or list expenses
   Examples: "Add 500 for lunch", "Delete last expense", "Show my expenses"

2. qa: Questions about policies, procedures, or general queries
   Examples: "What's the meal limit?", "How do I submit expenses?"

3. reconciliation: Compare, reconcile, or analyze expense reports
   Examples: "Compare my report with company data", "Reconcile January expenses"

4. clarification: Unclear or ambiguous requests
   Examples: "Help", "What can you do?", "I don't understand"

${parser.getFormatInstructions()}
`;

    const response = await llm.invoke(prompt);
    const result = await parser.parse(response.content);
    
    console.log(`[Intent Classification] ${result.intent} (${result.confidence}): ${result.reasoning}`);
    
    return {
      intent: result.intent,
      intentConfidence: result.confidence,
      intentReasoning: result.reasoning,
      steps: ["intent_classified"]
    };
    
  } catch (error) {
    console.error("[Intent Classification] Error:", error);
    
    // Fallback to clarification on error
    return {
      intent: "clarification",
      intentConfidence: 0,
      intentReasoning: `Error during classification: ${error.message}`,
      steps: ["intent_classification_failed"]
    };
  }
};
```

### 25.7 Node Composition Patterns

#### **Pattern 1: Sequential Processing in Node**

```javascript
const multiStepNode = async (state) => {
  // Step 1: Fetch data
  const data = await fetchData(state.id);
  
  // Step 2: Transform
  const transformed = transformData(data);
  
  // Step 3: Validate
  const valid = validateData(transformed);
  
  return {
    data: valid ? transformed : null,
    isValid: valid
  };
};
```

#### **Pattern 2: Conditional Logic in Node**

```javascript
const conditionalNode = async (state) => {
  if (state.amount > 1000) {
    // High-value expense: Needs approval
    return {
      requiresApproval: true,
      approver: "manager"
    };
  } else {
    // Low-value: Auto-approve
    return {
      requiresApproval: false,
      status: "approved"
    };
  }
};
```

#### **Pattern 3: Retry Logic in Node**

```javascript
const retryNode = async (state) => {
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await unstableOperation(state.input);
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await sleep(1000 * attempt);  // Exponential backoff
    }
  }
  
  // All retries failed
  return {
    error: `Failed after ${maxRetries} attempts: ${lastError.message}`,
    result: null
  };
};
```

**✅ You now understand Nodes!**

---

## Chapter 26: Edges - Connecting the Flow

### 26.1 What Are Edges?

**Edge = Connection between nodes** (defines graph flow)

Types of edges:
- ➡️ **Simple Edge**: Always go from A to B
- 🔀 **Conditional Edge**: Choose path based on state
- ⚡ **Parallel Edges**: Multiple paths from same node
- 🔁 **Loop Edges**: Go back to previous node

### 26.2 Simple Edges

**Always transition from one node to another**

```javascript
// A → B (always)
graph.addEdge("nodeA", "nodeB");

// Entry and exit
graph.addEdge(START, "firstNode");
graph.addEdge("lastNode", END);
```

**Example: Linear flow**

```javascript
graph.addEdge(START, "fetch_data");
graph.addEdge("fetch_data", "process_data");
graph.addEdge("process_data", "save_data");
graph.addEdge("save_data", END);

// Flow: START → fetch_data → process_data → save_data → END
```

### 26.3 Conditional Edges

**Choose next node based on state** (routing logic)

```javascript
graph.addConditionalEdges(
  "sourceNode",  // From this node
  routerFunction,  // Function that returns next node name
  {  // Mapping of return values to node names
    "option1": "nodeA",
    "option2": "nodeB",
    "option3": "nodeC"
  }
);
```

#### **Router Function**

```javascript
// Router receives current state
const routerFunction = (state) => {
  // Decision logic
  if (state.errors.length > 0) {
    return "error_handler";
  }
  
  if (state.requiresApproval) {
    return "approval_node";
  }
  
  return "success_node";
};

// Use in graph
graph.addConditionalEdges(
  "validation_node",
  routerFunction,
  {
    error_handler: "error_handler",
    approval_node: "approval_node",
    success_node: "success_node"
  }
);
```

### 26.4 Real Example: Intent Router Edges

```javascript
// File: src/graphs/intentRouter.graph.js (edges section)

// After classification, route based on intent
graph.addConditionalEdges(
  "classify_intent",
  (state) => {
    // Low confidence → clarification
    if (state.intentConfidence < 0.6) {
      return "clarification";
    }
    
    // High confidence → route by intent
    return state.intent;
  },
  {
    transactional: "transactional_handler",
    qa: "qa_handler",
    reconciliation: "reconciliation_handler",
    clarification: "clarification_handler"
  }
);
```

### 26.5 START and END Special Nodes

```javascript
import { START, END } from "@langchain/langgraph";

// START: Entry point (no implementation needed)
graph.addEdge(START, "first_node");

// END: Exit point (no implementation needed)
graph.addEdge("final_node", END);

// Multiple paths to END
graph.addEdge("success_node", END);
graph.addEdge("error_node", END);
graph.addEdge("timeout_node", END);
```

### 26.6 Looping with Edges

**Create loops for retry/iteration logic**

```javascript
// Node that might need to retry
const processNode = async (state) => {
  const result = await tryProcess(state.data);
  
  return {
    processed: result.success,
    attempts: state.attempts + 1
  };
};

// Add nodes
graph.addNode("process", processNode);
graph.addNode("check_result", checkResultNode);

// Loop back if not processed
graph.addConditionalEdges(
  "check_result",
  (state) => {
    if (!state.processed && state.attempts < 3) {
      return "retry";  // Go back to process
    }
    return "done";
  },
  {
    retry: "process",  // Loop back
    done: END
  }
);
```

**Flow**:
```
START → process → check_result
          ↑            │
          └────────────┘ (if retry)
               │
               └──→ END (if done)
```

### 26.7 Multiple Edges from Same Node

**Fan-out pattern** (node leads to multiple nodes)

```javascript
// Method 1: Conditional (choose one path)
graph.addConditionalEdges(
  "router",
  (state) => state.path,
  {
    pathA: "nodeA",
    pathB: "nodeB",
    pathC: "nodeC"
  }
);

// Method 2: Parallel (all paths execute)
graph.addEdge("parallel_start", "taskA");
graph.addEdge("parallel_start", "taskB");
graph.addEdge("parallel_start", "taskC");
// All three tasks run in parallel (Chapter 29)
```

### 26.8 Multiple Edges to Same Node

**Fan-in pattern** (multiple nodes converge)

```javascript
// Multiple nodes → one node
graph.addEdge("taskA", "aggregator");
graph.addEdge("taskB", "aggregator");
graph.addEdge("taskC", "aggregator");

// Aggregator waits for all tasks to complete
const aggregatorNode = async (state) => {
  // state contains results from taskA, taskB, taskC
  return {
    finalResult: combineResults(state)
  };
};
```

### 26.9 Visualizing Graph Structure

**Debug graph structure**

```javascript
const workflow = graph.compile();

// Get graph structure (for visualization/debugging)
console.log(workflow.getGraph());

// Output shows all nodes and edges:
// {
//   nodes: ["START", "classify_intent", "transactional_handler", ..., "END"],
//   edges: [
//     { source: "START", target: "classify_intent" },
//     { source: "classify_intent", target: "transactional_handler", condition: "..." },
//     ...
//   ]
// }
```

### 26.10 Edge Best Practices

#### **1. Always Connect to END**

```javascript
// ✅ Good: All paths reach END
graph.addEdge("success", END);
graph.addEdge("error", END);
graph.addEdge("timeout", END);

// ❌ Bad: Dead end (node with no outgoing edge)
graph.addNode("orphan", orphanNode);
// No edge from "orphan" → graph execution stops here
```

#### **2. Validate Router Outputs**

```javascript
// ✅ Good: Router returns known node names
const router = (state) => {
  const validOptions = ["nodeA", "nodeB", "nodeC"];
  const choice = determineChoice(state);
  
  if (!validOptions.includes(choice)) {
    console.error(`Invalid router output: ${choice}`);
    return "nodeA";  // Fallback
  }
  
  return choice;
};

// ❌ Bad: Typo in router
const badRouter = (state) => {
  return "nod A";  // ← Runtime error! No node named "nod A"
};
```

#### **3. Document Complex Routing**

```javascript
// ✅ Good: Clear documentation
graph.addConditionalEdges(
  "classification",
  (state) => {
    // Route based on intent confidence:
    // - High confidence (>= 0.8): Use classified intent
    // - Medium confidence (0.5-0.8): Ask for clarification
    // - Low confidence (< 0.5): Default to general handler
    
    if (state.confidence >= 0.8) {
      return state.intent;
    } else if (state.confidence >= 0.5) {
      return "clarification";
    } else {
      return "general_handler";
    }
  },
  { /* mapping */ }
);
```

**✅ You now understand Edges!**

---

## Chapter 27: State Management

### 27.1 Understanding State Flow

**State = Shared data structure flowing through graph**

Think of state as:
- 📦 **Shared Memory**: All nodes read/write to same state
- 🔄 **Immutable**: Nodes don't modify state directly, they return updates
- 🧩 **Merged**: Updates merged via reducers (append, replace, sum, etc.)

#### **State Flow Example**

```javascript
// Initial state
{ input: "hello", messages: [], counter: 0 }

// Node 1 returns
{ messages: [{ role: "user", content: "hello" }], counter: 1 }

// State after merge (using reducers)
{ input: "hello", messages: [{ role: "user", content: "hello" }], counter: 1 }

// Node 2 returns
{ messages: [{ role: "assistant", content: "hi" }], counter: 1 }

// State after merge
{
  input: "hello",
  messages: [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" }  ← Appended via reducer
  ],
  counter: 2  ← Summed via reducer
}
```

### 27.2 State Reducers Deep Dive

**Reducer = Function that merges old value + new value**

#### **Reducer Signature**

```javascript
const reducer = (existing, update) => {
  // existing: Current value in state
  // update: New value from node
  // return: Merged value
};
```

#### **Common Reducer Patterns**

##### **1. Replace (Default)**

```javascript
const StateAnnotation = Annotation.Root({
  status: Annotation<string>()  // No reducer = replace
});

// Node returns: { status: "processing" }
// State: { status: "processing" }  (replaced old value)

// Node returns: { status: "completed" }
// State: { status: "completed" }  (replaced again)
```

##### **2. Append to Array**

```javascript
const StateAnnotation = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (existing, update) => [...existing, ...update]
  })
});

// Initial: { messages: [] }
// Node returns: { messages: [{ role: "user", content: "Hi" }] }
// State: { messages: [{ role: "user", content: "Hi" }] }

// Node returns: { messages: [{ role: "assistant", content: "Hello" }] }
// State: { messages: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }] }
```

##### **3. Sum Numbers**

```javascript
const StateAnnotation = Annotation.Root({
  totalCost: Annotation<number>({
    reducer: (existing, update) => existing + update,
    default: () => 0
  })
});

// Initial: { totalCost: 0 }
// Node returns: { totalCost: 100 }
// State: { totalCost: 100 }  (0 + 100)

// Node returns: { totalCost: 50 }
// State: { totalCost: 150 }  (100 + 50)
```

##### **4. Merge Objects**

```javascript
const StateAnnotation = Annotation.Root({
  metadata: Annotation<Record<string, any>>({
    reducer: (existing, update) => ({ ...existing, ...update })
  })
});

// Initial: { metadata: {} }
// Node returns: { metadata: { source: "user", timestamp: "..." } }
// State: { metadata: { source: "user", timestamp: "..." } }

// Node returns: { metadata: { processed: true } }
// State: { metadata: { source: "user", timestamp: "...", processed: true } }
```

##### **5. Keep First Value (Ignore Updates)**

```javascript
const StateAnnotation = Annotation.Root({
  userId: Annotation<number>({
    reducer: (existing, update) => existing !== undefined ? existing : update
  })
});

// Initial: { userId: undefined }
// Node returns: { userId: 123 }
// State: { userId: 123 }

// Node returns: { userId: 456 }
// State: { userId: 123 }  ← Ignored (kept first value)
```

##### **6. Custom Merge Logic**

```javascript
const StateAnnotation = Annotation.Root({
  expenses: Annotation<Expense[]>({
    reducer: (existing, update) => {
      // Merge arrays, avoiding duplicates by ID
      const existingIds = new Set(existing.map(e => e.id));
      const newExpenses = update.filter(e => !existingIds.has(e.id));
      return [...existing, ...newExpenses];
    }
  })
});
```

### 27.3 State Initialization

#### **Method 1: Default Values in Schema**

```javascript
const StateAnnotation = Annotation.Root({
  counter: Annotation<number>({
    default: () => 0
  }),
  
  items: Annotation<string[]>({
    default: () => []
  }),
  
  timestamp: Annotation<string>({
    default: () => new Date().toISOString()
  })
});

// Invoke without these fields
const result = await workflow.invoke({ input: "hello" });
// State initialized with defaults:
// { input: "hello", counter: 0, items: [], timestamp: "2026-02-09T..." }
```

#### **Method 2: Provide at Invoke**

```javascript
const result = await workflow.invoke({
  input: "hello",
  counter: 5,  // Override default
  items: ["existing"],
  metadata: { source: "api" }
});
```

### 27.4 Partial State Updates

**Nodes return only fields they want to update**

```javascript
// State: { name: "John", age: 25, city: "NYC", balance: 1000 }

// Node 1: Update only age
const node1 = async (state) => {
  return { age: 26 };
};
// State after: { name: "John", age: 26, city: "NYC", balance: 1000 }

// Node 2: Update balance and city
const node2 = async (state) => {
  return { balance: 1500, city: "LA" };
};
// State after: { name: "John", age: 26, city: "LA", balance: 1500 }

// Node 3: Don't update anything
const node3 = async (state) => {
  console.log("Just logging:", state.name);
  return {};  // Empty update = no changes
};
// State after: { name: "John", age: 26, city: "LA", balance: 1500 }  (unchanged)
```

### 27.5 Reading State in Nodes

```javascript
const myNode = async (state, config) => {
  // Access any field from state
  const userMessage = state.userMessage;
  const previousResults = state.results;
  const userId = config.configurable.userId;
  
  // Use state for decisions
  if (state.errors.length > 0) {
    // Handle errors
  }
  
  // Use state for context
  const context = state.conversationHistory.slice(-5);  // Last 5 messages
  
  return { /* updates */ };
};
```

### 27.6 Real Example: ai-langx/ Intent Router State

```javascript
// File: src/graphs/intentRouter.graph.js

import { Annotation } from "@langchain/langgraph";

// Define state schema
export const IntentStateAnnotation = Annotation.Root({
  // Input
  userMessage: Annotation<string>(),
  
  // Classification results
  intent: Annotation<string>(),
  intentConfidence: Annotation<number>(),
  intentReasoning: Annotation<string>(),
  
  // Handler results
  finalResponse: Annotation<string>(),
  sources: Annotation<any[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  
  // Tracking
  steps: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  
  // Error handling
  error: Annotation<string | null>({
    default: () => null
  })
});

// Example flow through state:

// 1. Initial invoke
await workflow.invoke({
  userMessage: "Add 500 for lunch"
});
// State: { userMessage: "Add 500 for lunch", steps: [], sources: [], error: null }

// 2. After classify_intent node
// Node returns: { intent: "transactional", intentConfidence: 0.95, steps: ["classified"] }
// State: {
//   userMessage: "Add 500 for lunch",
//   intent: "transactional",
//   intentConfidence: 0.95,
//   steps: ["classified"],
//   sources: [],
//   error: null
// }

// 3. After transactional_handler node
// Node returns: { finalResponse: "Added expense...", steps: ["transactional_completed"] }
// State: {
//   userMessage: "Add 500 for lunch",
//   intent: "transactional",
//   intentConfidence: 0.95,
//   steps: ["classified", "transactional_completed"],  ← Appended
//   finalResponse: "Added expense...",
//   sources: [],
//   error: null
// }
```

### 27.7 State Validation

**Validate state at node entry**

```javascript
const validateState = (state, requiredFields) => {
  const missing = requiredFields.filter(field => !state[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

const myNode = async (state) => {
  // Validate required fields
  validateState(state, ["userId", "amount", "description"]);
  
  // Proceed with confidence
  return { /* updates */ };
};
```

### 27.8 State Debugging

```javascript
const debugNode = async (state, config) => {
  console.log("=== State Debug ===");
  console.log("User ID:", config.configurable.userId);
  console.log("Current State:", JSON.stringify(state, null, 2));
  console.log("===================");
  
  // Don't modify state
  return {};
};

// Add debug node at any point
graph.addNode("debug", debugNode);
graph.addEdge("some_node", "debug");
graph.addEdge("debug", "next_node");
```

### 27.9 State Size Considerations

**State persisted at each step** (with checkpointers)

```javascript
// ❌ Bad: Storing large data in state
const badNode = async (state) => {
  const allExpenses = await fetchAllExpenses();  // 10,000 records
  return {
    expenses: allExpenses  // Stored in state (persisted at every step!)
  };
};

// ✅ Good: Store only IDs, fetch when needed
const goodNode = async (state) => {
  const expenseIds = await fetchExpenseIds();  // [1, 2, 3, ...]
  return {
    expenseIds  // Lightweight
  };
};

const laterNode = async (state) => {
  // Fetch full data only when needed
  const expenses = await fetchExpensesByIds(state.expenseIds);
  return { /* process expenses */ };
};
```

**✅ You now understand State Management!**

---

## Chapter 28: Conditional Routing

### 28.1 What Is Conditional Routing?

**Conditional Routing = Choose next node based on state** (if/else in graph form)

Use cases:
- 🎯 **Intent Classification**: Route by detected intent
- ✅ **Validation**: Success path vs error path
- 🔐 **Authorization**: Approved vs needs approval
- 🔁 **Retry Logic**: Retry vs give up
- 🎚️ **Confidence Thresholds**: High confidence vs low confidence

### 28.2 Basic Conditional Edge

```javascript
graph.addConditionalEdges(
  "source_node",  // From this node
  
  // Router function: (state) => string (node name)
  (state) => {
    if (state.isValid) {
      return "success_node";
    } else {
      return "error_node";
    }
  },
  
  // Path mapping (optional but recommended)
  {
    success_node: "success_node",
    error_node: "error_node"
  }
);
```

### 28.3 Router Function Patterns

#### **Pattern 1: Binary Decision**

```javascript
const binaryRouter = (state) => {
  return state.isApproved ? "approved_path" : "rejected_path";
};

graph.addConditionalEdges("check_approval", binaryRouter, {
  approved_path: "approved_path",
  rejected_path: "rejected_path"
});
```

#### **Pattern 2: Multi-Way Branch**

```javascript
const multiRouter = (state) => {
  if (state.amount < 1000) {
    return "auto_approve";
  } else if (state.amount < 10000) {
    return "manager_approval";
  } else {
    return "director_approval";
  }
};

graph.addConditionalEdges("check_amount", multiRouter, {
  auto_approve: "auto_approve",
  manager_approval: "manager_approval",
  director_approval: "director_approval"
});
```

#### **Pattern 3: Enum-Based Routing**

```javascript
const enumRouter = (state) => {
  // State contains enum value
  return state.intent;  // "transactional" | "qa" | "reconciliation"
};

graph.addConditionalEdges("classify", enumRouter, {
  transactional: "transactional_handler",
  qa: "qa_handler",
  reconciliation: "reconciliation_handler"
});
```

#### **Pattern 4: Complex Conditions**

```javascript
const complexRouter = (state) => {
  // Multiple conditions
  const hasErrors = state.errors.length > 0;
  const isRetry = state.attempts > 1;
  const maxRetriesReached = state.attempts >= 3;
  
  if (hasErrors && maxRetriesReached) {
    return "give_up";
  } else if (hasErrors && !maxRetriesReached) {
    return "retry";
  } else if (isRetry) {
    return "success_after_retry";
  } else {
    return "success";
  }
};

graph.addConditionalEdges("process", complexRouter, {
  retry: "process",  // Loop back
  give_up: "error_handler",
  success: END,
  success_after_retry: END
});
```

### 28.4 Real Example: ai-langx/ Intent Router

```javascript
// File: src/graphs/intentRouter.graph.js

import { StateGraph, START, END } from "@langchain/langgraph";
import { IntentStateAnnotation } from "./state";
import { classifyIntentNode } from "./nodes/classifyIntent.node";
import { transactionalHandler } from "./nodes/transactionalHandler.node";
import { qaHandler } from "./nodes/qaHandler.node";
import { reconciliationHandler } from "./nodes/reconciliationHandler.node";
import { clarificationHandler } from "./nodes/clarificationHandler.node";

// Create graph
const graph = new StateGraph(IntentStateAnnotation);

// Add nodes
graph.addNode("classify_intent", classifyIntentNode);
graph.addNode("transactional_handler", transactionalHandler);
graph.addNode("qa_handler", qaHandler);
graph.addNode("reconciliation_handler", reconciliationHandler);
graph.addNode("clarification_handler", clarificationHandler);

// Entry point
graph.addEdge(START, "classify_intent");

// CONDITIONAL ROUTING: Choose handler based on intent + confidence
graph.addConditionalEdges(
  "classify_intent",
  
  // Router function
  (state) => {
    console.log(`[Router] Intent: ${state.intent}, Confidence: ${state.intentConfidence}`);
    
    // Low confidence → ask for clarification
    if (state.intentConfidence < 0.6) {
      console.log("[Router] Low confidence, requesting clarification");
      return "clarification";
    }
    
    // High confidence → route by intent
    console.log(`[Router] High confidence, routing to ${state.intent}`);
    return state.intent;
  },
  
  // Path mapping
  {
    transactional: "transactional_handler",
    qa: "qa_handler",
    reconciliation: "reconciliation_handler",
    clarification: "clarification_handler"
  }
);

// All handlers → END
graph.addEdge("transactional_handler", END);
graph.addEdge("qa_handler", END);
graph.addEdge("reconciliation_handler", END);
graph.addEdge("clarification_handler", END);

// Compile
export const intentRouterGraph = graph.compile();
```

**Flow Visualization**:

```
      START
        ↓
  classify_intent
        ↓
   [Router Decision]
   /    |    |    \
  /     |    |     \
T  |  QA | Rec | Clar   (based on intent + confidence)
  \     |    |     /
   \    |    |    /
        ↓
       END
```

### 28.5 Confidence-Based Routing

**Route based on confidence scores**

```javascript
const confidenceRouter = (state) => {
  const confidence = state.intentConfidence;
  
  if (confidence >= 0.9) {
    return "high_confidence";  // Execute immediately
  } else if (confidence >= 0.6) {
    return "medium_confidence";  // Execute with validation
  } else {
    return "low_confidence";  // Ask for clarification
  }
};

// High confidence: Direct execution
const highConfidenceNode = async (state) => {
  // Execute without validation
  return { result: await executeAction(state.intent) };
};

// Medium confidence: Validate then execute
const mediumConfidenceNode = async (state) => {
  // Show user what we understood, wait for confirmation
  return {
    needsConfirmation: true,
    proposedAction: formatAction(state.intent)
  };
};

// Low confidence: Ask for clarification
const lowConfidenceNode = async (state) => {
  return {
    finalResponse: "I'm not sure I understood. Could you rephrase?"
  };
};
```

### 28.6 Error Handling with Routing

```javascript
// Node that might fail
const riskyNode = async (state) => {
  try {
    const result = await riskyOperation(state.input);
    return { result, status: "success" };
  } catch (error) {
    return { error: error.message, status: "error" };
  }
};

// Router handles success vs error
graph.addConditionalEdges(
  "risky_node",
  (state) => state.status,  // "success" or "error"
  {
    success: "success_handler",
    error: "error_handler"
  }
);

const errorHandler = async (state) => {
  console.error("[Error]", state.error);
  
  // Decide: retry or give up
  if (state.attempts < 3) {
    return {
      status: "retry",
      attempts: state.attempts + 1
    };
  } else {
    return {
      finalResponse: `Failed after 3 attempts: ${state.error}`,
      status: "failed"
    };
  }
};

// Router for error handler
graph.addConditionalEdges(
  "error_handler",
  (state) => state.status,
  {
    retry: "risky_node",  // Loop back
    failed: END
  }
);
```

### 28.7 Fallback Routing

**Always have a fallback path**

```javascript
const safeRouter = (state) => {
  const validIntents = ["transactional", "qa", "reconciliation"];
  
  // Known intent
  if (validIntents.includes(state.intent)) {
    return state.intent;
  }
  
  // Unknown intent → fallback
  console.warn(`[Router] Unknown intent: ${state.intent}, using fallback`);
  return "clarification";
};

graph.addConditionalEdges("classify", safeRouter, {
  transactional: "transactional_handler",
  qa: "qa_handler",
  reconciliation: "reconciliation_handler",
  clarification: "clarification_handler"  // Fallback
});
```

### 28.8 Multi-Stage Routing

**Route multiple times in same graph**

```javascript
// Stage 1: Route by category
graph.addConditionalEdges(
  "categorize",
  (state) => state.category,
  {
    expense: "expense_processor",
    report: "report_processor"
  }
);

// Stage 2: Route expense by amount
graph.addConditionalEdges(
  "expense_processor",
  (state) => state.amount > 1000 ? "high_value" : "low_value",
  {
    high_value: "approval_required",
    low_value: "auto_approve"
  }
);

// Stage 3: Route report by type
graph.addConditionalEdges(
  "report_processor",
  (state) => state.reportType,
  {
    summary: "summary_generator",
    detailed: "detailed_generator"
  }
);
```

### 28.9 Debugging Routers

```javascript
const debugRouter = (state) => {
  const decision = determineNextNode(state);
  
  console.log("=== Router Debug ===");
  console.log("State:", JSON.stringify(state, null, 2));
  console.log("Decision:", decision);
  console.log("====================");
  
  return decision;
};

graph.addConditionalEdges("classify", debugRouter, { /* paths */ });
```

**✅ You now understand Conditional Routing!**

---

## Chapter 29: Parallel Execution

### 29.1 What Is Parallel Execution?

**Parallel Execution = Multiple nodes run simultaneously** (not sequentially)

Use cases:
- ⚡ **Independent Tasks**: Fetch from multiple APIs at once
- 🔄 **Parallelizable Validation**: Run multiple validators simultaneously
- 📊 **Concurrent Processing**: Process multiple data sources in parallel
- 🎯 **Fan-Out/Fan-In**: Split work, process in parallel, then combine

### 29.2 Creating Parallel Paths

**Multiple edges from same node → parallel execution**

```javascript
// All three nodes run in parallel (started simultaneously)
graph.addEdge(START, "taskA");
graph.addEdge(START, "taskB");
graph.addEdge(START, "taskC");

// Wait for all to complete, then converge
graph.addEdge("taskA", "aggregator");
graph.addEdge("taskB", "aggregator");
graph.addEdge("taskC", "aggregator");

graph.addEdge("aggregator", END);
```

**Flow**:
```
       START
      /  |  \
     /   |   \
    A    B    C  ← Run in parallel
     \   |   /
      \  |  /
    aggregator  ← Wait for all, then combine
        ↓
       END
```

### 29.3 Real Example: Parallel Validation

```javascript
// File: examples/parallelValidation.graph.js

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// State
const ValidationStateAnnotation = Annotation.Root({
  description: Annotation<string>(),
  amount: Annotation<number>(),
  category: Annotation<string>(),
  
  errors: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  
  isValid: Annotation<boolean>({
    default: () => false
  })
});

// Validation nodes (run in parallel)
const validateAmount = async (state) => {
  console.log("[validateAmount] Checking amount...");
  await sleep(1000);  // Simulate work
  
  const errors = [];
  if (state.amount <= 0) errors.push("Amount must be positive");
  if (state.amount > 100000) errors.push("Amount exceeds limit");
  
  console.log("[validateAmount] Done");
  return { errors };
};

const validateCategory = async (state) => {
  console.log("[validateCategory] Checking category...");
  await sleep(1500);  // Simulate work
  
  const validCategories = ["Food", "Transport", "Shopping", "Entertainment"];
  const errors = [];
  if (!validCategories.includes(state.category)) {
    errors.push(`Invalid category: ${state.category}`);
  }
  
  console.log("[validateCategory] Done");
  return { errors };
};

const validateDescription = async (state) => {
  console.log("[validateDescription] Checking description...");
  await sleep(800);  // Simulate work
  
  const errors = [];
  if (!state.description || state.description.trim().length === 0) {
    errors.push("Description is required");
  }
  
  console.log("[validateDescription] Done");
  return { errors };
};

// Aggregator (waits for all parallel nodes)
const finalizeValidation = async (state) => {
  console.log("[finalizeValidation] All validators complete");
  console.log(`Errors collected: ${state.errors.length}`);
  
  return {
    isValid: state.errors.length === 0
  };
};

// Build graph
const graph = new StateGraph(ValidationStateAnnotation);

graph.addNode("validate_amount", validateAmount);
graph.addNode("validate_category", validateCategory);
graph.addNode("validate_description", validateDescription);
graph.addNode("finalize", finalizeValidation);

// PARALLEL: All validators start at once
graph.addEdge(START, "validate_amount");
graph.addEdge(START, "validate_category");
graph.addEdge(START, "validate_description");

// FAN-IN: All converge to finalize
graph.addEdge("validate_amount", "finalize");
graph.addEdge("validate_category", "finalize");
graph.addEdge("validate_description", "finalize");

graph.addEdge("finalize", END);

const workflow = graph.compile();

// Execute
console.time("Parallel Validation");
const result = await workflow.invoke({
  description: "Lunch",
  amount: 500,
  category: "Food",
  errors: []
});
console.timeEnd("Parallel Validation");
// Output: ~1500ms (longest node), not 1000+1500+800=3300ms sequential

console.log(result);
// { description: "Lunch", amount: 500, category: "Food", errors: [], isValid: true }
```

**Performance**:
- Sequential: 1000ms + 1500ms + 800ms = 3300ms
- Parallel: max(1000ms, 1500ms, 800ms) = 1500ms ✅ **2.2x faster**

### 29.4 Fan-Out/Fan-In Pattern

**Split work → Process in parallel → Combine results**

```javascript
// Fan-Out: Split data
const splitNode = async (state) => {
  const chunks = splitIntoChunks(state.data, 3);
  return {
    chunk1: chunks[0],
    chunk2: chunks[1],
    chunk3: chunks[2]
  };
};

// Process chunks in parallel
const processChunk1 = async (state) => {
  return { result1: processData(state.chunk1) };
};

const processChunk2 = async (state) => {
  return { result2: processData(state.chunk2) };
};

const processChunk3 = async (state) => {
  return { result3: processData(state.chunk3) };
};

// Fan-In: Combine results
const combineNode = async (state) => {
  const combined = [
    ...state.result1,
    ...state.result2,
    ...state.result3
  ];
  
  return { finalResult: combined };
};

// Graph
graph.addNode("split", splitNode);
graph.addNode("process1", processChunk1);
graph.addNode("process2", processChunk2);
graph.addNode("process3", processChunk3);
graph.addNode("combine", combineNode);

graph.addEdge(START, "split");

// Fan-out
graph.addEdge("split", "process1");
graph.addEdge("split", "process2");
graph.addEdge("split", "process3");

// Fan-in
graph.addEdge("process1", "combine");
graph.addEdge("process2", "combine");
graph.addEdge("process3", "combine");

graph.addEdge("combine", END);
```

#### **State Accumulation with Reducers**

```javascript
const StateAnnotation = Annotation.Root({
  data: Annotation<any[]>(),
  
  // Results accumulate from parallel nodes
  results: Annotation<any[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  })
});

// Three parallel processors
const processor1 = async (state) => {
  const result = await process(state.data.slice(0, 100));
  return { results: [result] };  // Appended to array
};

const processor2 = async (state) => {
  const result = await process(state.data.slice(100, 200));
  return { results: [result] };  // Appended to array
};

const processor3 = async (state) => {
  const result = await process(state.data.slice(200, 300));
  return { results: [result] };  // Appended to array
};

// After all parallel nodes complete:
// state.results = [result1, result2, result3]
```

### 29.5 Parallel API Calls

```javascript
const StateAnnotation = Annotation.Root({
  userId: Annotation<number>(),
  
  expenses: Annotation<any[]>({
    default: () => []
  }),
  
  categories: Annotation<any[]>({
    default: () => []
  }),
  
  reports: Annotation<any[]>({
    default: () => []
  })
});

// Fetch from three APIs in parallel
const fetchExpenses = async (state, config) => {
  const authToken = config.configurable.authToken;
  const expenses = await backendClient.get(`/api/expenses?userId=${state.userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  return { expenses: expenses.data };
};

const fetchCategories = async (state, config) => {
  const authToken = config.configurable.authToken;
  const categories = await backendClient.get('/api/categories', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  return { categories: categories.data };
};

const fetchReports = async (state, config) => {
  const authToken = config.configurable.authToken;
  const reports = await backendClient.get(`/api/reports?userId=${state.userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  return { reports: reports.data };
};

const aggregateData = async (state) => {
  return {
    aggregated: {
      totalExpenses: state.expenses.length,
      totalCategories: state.categories.length,
      totalReports: state.reports.length
    }
  };
};

// Graph
graph.addNode("fetch_expenses", fetchExpenses);
graph.addNode("fetch_categories", fetchCategories);
graph.addNode("fetch_reports", fetchReports);
graph.addNode("aggregate", aggregateData);

// Parallel fetches
graph.addEdge(START, "fetch_expenses");
graph.addEdge(START, "fetch_categories");
graph.addEdge(START, "fetch_reports");

// Aggregate
graph.addEdge("fetch_expenses", "aggregate");
graph.addEdge("fetch_categories", "aggregate");
graph.addEdge("fetch_reports", "aggregate");

graph.addEdge("aggregate", END);
```

### 29.6 Conditional Parallel Execution

**Start parallel paths based on condition**

```javascript
const routerNode = async (state) => {
  return {
    needsExpenses: state.includeExpenses,
    needsReports: state.includeReports
  };
};

graph.addNode("router", routerNode);
graph.addNode("fetch_expenses", fetchExpensesNode);
graph.addNode("fetch_reports", fetchReportsNode);
graph.addNode("combine", combineNode);

// Conditional parallel edges
graph.addConditionalEdges(
  "router",
  (state) => {
    const paths = [];
    if (state.needsExpenses) paths.push("expenses");
    if (state.needsReports) paths.push("reports");
    if (paths.length === 0) return "combine";  // Skip to combined
    return paths.join(",");  // "expenses" | "reports" | "expenses,reports"
  },
  {
    "expenses": "fetch_expenses",
    "reports": "fetch_reports",
    "expenses,reports": ["fetch_expenses", "fetch_reports"],  // Both
    "combine": "combine"
  }
);
```

### 29.7 Error Handling in Parallel Nodes

**One node fails → others continue**

```javascript
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

const resilientNode1 = async (state) => {
  try {
    const result = await riskyOperation1();
    return { results: [result] };
  } catch (error) {
    return { errors: [`Node1 failed: ${error.message}`] };
  }
};

const resilientNode2 = async (state) => {
  try {
    const result = await riskyOperation2();
    return { results: [result] };
  } catch (error) {
    return { errors: [`Node2 failed: ${error.message}`] };
  }
};

const resilientNode3 = async (state) => {
  try {
    const result = await riskyOperation3();
    return { results: [result] };
  } catch (error) {
    return { errors: [`Node3 failed: ${error.message}`] };
  }
};

// Aggregator checks errors
const checkResults = async (state) => {
  if (state.errors.length > 0) {
    console.warn("Some nodes failed:", state.errors);
  }
  
  return {
    finalResult: state.results,  // Contains only successful results
    hasErrors: state.errors.length > 0
  };
};
```

### 29.8 Parallel Execution Limits

**LangGraph executes parallel nodes concurrently** (up to JavaScript async limits)

```javascript
// Be careful with too many parallel nodes
// ❌ Bad: 100 parallel API calls (might hit rate limits)
for (let i = 0; i < 100; i++) {
  graph.addNode(`fetch_${i}`, async (state) => await fetchData(i));
  graph.addEdge(START, `fetch_${i}`);
}

// ✅ Good: Batch into groups
const createBatchNode = (batchIds) => async (state) => {
  const results = await Promise.all(
    batchIds.map(id => fetchData(id))
  );
  return { results };
};

// 10 parallel nodes, each fetching 10 items
for (let batch = 0; batch < 10; batch++) {
  const batchIds = Array.from({ length: 10 }, (_, i) => batch * 10 + i);
  graph.addNode(`batch_${batch}`, createBatchNode(batchIds));
  graph.addEdge(START, `batch_${batch}`);
}
```

**✅ You now understand Parallel Execution!**

---

## Chapter 30: Persistence & Checkpoints

### 30.1 What Is Persistence?

**Persistence = Save graph state at each step** (enable pause/resume, multi-turn conversations)

Use cases:
- 💬 **Multi-Turn Conversations**: Remember context across messages
- ⏸️ **Human-in-the-Loop**: Pause for approval, resume later
- 🔁 **Long-Running Workflows**: Resume if process crashes
- 📊 **Debugging**: Inspect state at any point

### 30.2 Checkpointer Concept

**Checkpointer = Storage backend for state snapshots**

Built-in checkpointers:
- `MemorySaver`: In-memory (lost on restart)
- `SqliteSaver`: SQLite database (persistent)
- `PostgresSaver`: PostgreSQL database (production)

### 30.3 Basic Persistence Setup

```javascript
import { StateGraph, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  messages: Annotation<{ role: string; content: string }[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  })
});

const graph = new StateGraph(StateAnnotation);

// Add nodes
graph.addNode("process", async (state) => {
  return {
    messages: [{ role: "assistant", content: "Processed!" }]
  };
});

graph.addEdge(START, "process");
graph.addEdge("process", END);

// Compile with checkpointer
const checkpointer = new MemorySaver();
const workflow = graph.compile({ checkpointer });

// Now graph saves state at each step
```

### 30.4 Thread IDs (Conversation Sessions)

**thread_id = Unique identifier for conversation/session**

```javascript
// First message in conversation
const result1 = await workflow.invoke(
  { messages: [{ role: "user", content: "Hi" }] },
  {
    configurable: { thread_id: "conversation-123" }
  }
);

// State saved to thread "conversation-123":
// { messages: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Processed!" }] }

// Second message in same conversation (context preserved)
const result2 = await workflow.invoke(
  { messages: [{ role: "user", content: "Tell me more" }] },
  {
    configurable: { thread_id: "conversation-123" }
  }
);

// State loaded from thread "conversation-123", new message appended:
// {
//   messages: [
//     { role: "user", content: "Hi" },
//     { role: "assistant", content: "Processed!" },
//     { role: "user", content: "Tell me more" },
//     { role: "assistant", content: "Processed!" }
//   ]
// }
```

### 30.5 Real Example: Multi-Turn Expense Conversation

```javascript
// File: examples/multiTurnExpense.graph.js

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// State with conversation history
const ConversationStateAnnotation = Annotation.Root({
  messages: Annotation<{ role: string; content: string }[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  
  extractedInfo: Annotation<{
    description?: string;
    amount?: number;
    category?: string;
  }>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({})
  })
});

// Node: Extract information from messages
const extractInfoNode = async (state) => {
  const llm = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });
  
  // Build context from message history
  const conversationHistory = state.messages.map(m => 
    `${m.role}: ${m.content}`
  ).join("\n");
  
  const prompt = `Extract expense information from this conversation:

${conversationHistory}

Extract:
- description (what was purchased)
- amount (number)
- category (Food, Transport, Shopping, etc.)

If information is missing, don't make it up. Only extract what's clearly stated.

Format as JSON: {"description": "...", "amount": 123, "category": "..."}
`;

  const response = await llm.invoke(prompt);
  const extracted = JSON.parse(response.content);
  
  return {
    extractedInfo: extracted,
    messages: [{
      role: "assistant",
      content: `I've extracted: ${JSON.stringify(extracted)}`
    }]
  };
};

// Build graph
const graph = new StateGraph(ConversationStateAnnotation);
graph.addNode("extract", extractInfoNode);
graph.addEdge(START, "extract");
graph.addEdge("extract", END);

// Compile with persistence
const checkpointer = new MemorySaver();
const workflow = graph.compile({ checkpointer });

// ===== Conversation =====

// Turn 1
const turn1 = await workflow.invoke(
  { messages: [{ role: "user", content: "I spent money on lunch" }] },
  { configurable: { thread_id: "user-456-session-1" } }
);
console.log(turn1.extractedInfo);
// { description: "lunch" }  ← Missing amount and category

// Turn 2 (context preserved)
const turn2 = await workflow.invoke(
  { messages: [{ role: "user", content: "It was 500 rupees" }] },
  { configurable: { thread_id: "user-456-session-1" } }
);
console.log(turn2.extractedInfo);
// { description: "lunch", amount: 500 }  ← Amount added, still missing category

// Turn 3 (full conversation context)
const turn3 = await workflow.invoke(
  { messages: [{ role: "user", content: "It's a food expense" }] },
  { configurable: { thread_id: "user-456-session-1" } }
);
console.log(turn3.extractedInfo);
// { description: "lunch", amount: 500, category: "Food" }  ← Complete!

// Final state
console.log(turn3.messages);
// [
//   { role: "user", content: "I spent money on lunch" },
//   { role: "assistant", content: "I've extracted: {\"description\":\"lunch\"}" },
//   { role: "user", content: "It was 500 rupees" },
//   { role: "assistant", content: "I've extracted: {\"description\":\"lunch\",\"amount\":500}" },
//   { role: "user", content: "It's a food expense" },
//   { role: "assistant", content: "I've extracted: {\"description\":\"lunch\",\"amount\":500,\"category\":\"Food\"}" }
// ]
```

### 30.6 Getting State History

```javascript
// Get all checkpoints for a thread
const checkpoints = await workflow.getStateHistory({
  configurable: { thread_id: "conversation-123" }
});

for (const checkpoint of checkpoints) {
  console.log("Step:", checkpoint.metadata.step);
  console.log("Node:", checkpoint.metadata.source);
  console.log("State:", checkpoint.values);
  console.log("---");
}

// Output:
// Step: 3
// Node: extract
// State: { messages: [...], extractedInfo: {...} }
// ---
// Step: 2
// Node: extract
// State: { messages: [...], extractedInfo: {...} }
// ---
// Step: 1
// Node: extract
// State: { messages: [...], extractedInfo: {...} }
```

### 30.7 Resuming from Checkpoint

```javascript
// Start workflow
const result1 = await workflow.invoke(
  { input: "Hello" },
  { configurable: { thread_id: "thread-789" } }
);

// Later... resume from same thread
const result2 = await workflow.invoke(
  { input: "Continue" },
  { configurable: { thread_id: "thread-789" } }
);
// State loaded from last checkpoint
```

### 30.8 SQLite Checkpointer (Persistent)

```javascript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

// Create SQLite checkpointer
const checkpointer = SqliteSaver.fromConnString("./checkpoints.db");

const workflow = graph.compile({ checkpointer });

// State now persisted to disk
// Survives process restarts
```

### 30.9 Clearing Thread State

```javascript
// Delete all checkpoints for a thread
await workflow.updateState(
  { configurable: { thread_id: "conversation-123" } },
  null  // Clear state
);

// Or manually with checkpointer
await checkpointer.delete({ configurable: { thread_id: "conversation-123" } });
```

### 30.10 Checkpoint Metadata

```javascript
// Add custom metadata to checkpoints
const result = await workflow.invoke(
  { input: "..." },
  {
    configurable: {
      thread_id: "conversation-123",
      user_id: 456,
      session_start: new Date().toISOString()
    }
  }
);

// Retrieve with metadata
const checkpoints = await workflow.getStateHistory({
  configurable: { thread_id: "conversation-123" }
});

console.log(checkpoints[0].config.configurable.user_id);  // 456
```

**✅ You now understand Persistence & Checkpoints!**

---

## Chapter 31: Streaming & Real-Time Updates

### 31.1 What Is Streaming?

**Streaming = Get real-time updates as graph executes** (don't wait for final result)

Use cases:
- 🔄 **Progress Updates**: Show user what's happening
- ⚡ **Real-Time UI**: Update UI as each node completes
- 📊 **Debugging**: See execution flow in real-time
- 💬 **Streaming LLM Responses**: Show tokens as they're generated

### 31.2 Stream vs Invoke

```javascript
// invoke: Wait for final result
const result = await workflow.invoke({ input: "Hello" });
console.log(result);  // Final state after all nodes

// stream: Get updates as nodes complete
for await (const chunk of await workflow.stream({ input: "Hello" })) {
  console.log("Update:", chunk);  // Each node's output
}
```

### 31.3 Basic Streaming

```javascript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  result: Annotation<string>()
});

const graph = new StateGraph(StateAnnotation);

graph.addNode("step1", async (state) => {
  console.log("[step1] Processing...");
  await sleep(1000);
  return { result: "Step 1 done" };
});

graph.addNode("step2", async (state) => {
  console.log("[step2] Processing...");
  await sleep(1000);
  return { result: state.result + " → Step 2 done" };
});

graph.addNode("step3", async (state) => {
  console.log("[step3] Processing...");
  await sleep(1000);
  return { result: state.result + " → Step 3 done" };
});

graph.addEdge(START, "step1");
graph.addEdge("step1", "step2");
graph.addEdge("step2", "step3");
graph.addEdge("step3", END);

const workflow = graph.compile();

// Stream execution
console.log("Streaming...");
for await (const chunk of await workflow.stream({ input: "Hello" })) {
  console.log("Chunk received:", chunk);
}

// Output:
// [step1] Processing...
// Chunk received: { step1: { result: "Step 1 done" } }
// [step2] Processing...
// Chunk received: { step2: { result: "Step 1 done → Step 2 done" } }
// [step3] Processing...
// Chunk received: { step3: { result: "Step 1 done → Step 2 done → Step 3 done" } }
```

### 31.4 Stream Format

**Each chunk = `{ [nodeName]: nodeOutput }`**

```javascript
for await (const chunk of await workflow.stream({ input: "..." })) {
  // chunk structure:
  // {
  //   "node_name": {
  //     field1: value1,
  //     field2: value2
  //   }
  // }
  
  const nodeName = Object.keys(chunk)[0];
  const nodeOutput = chunk[nodeName];
  
  console.log(`Node "${nodeName}" completed with:`, nodeOutput);
}
```

### 31.5 Real Example: Streaming Expense Creation

```javascript
// File: examples/streamingExpenseCreation.js

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const ExpenseCreationStateAnnotation = Annotation.Root({
  userMessage: Annotation<string>(),
  parsed: Annotation<any>(),
  validated: Annotation<boolean>(),
  saved: Annotation<any>(),
  finalResponse: Annotation<string>()
});

const parseExpense = async (state) => {
  console.log("[parseExpense] Parsing user message...");
  await sleep(500);
  
  // Simulate LLM parsing
  const parsed = {
    description: "Lunch at restaurant",
    amount: 500,
    category: "Food"
  };
  
  return { parsed };
};

const validateExpense = async (state) => {
  console.log("[validateExpense] Validating parsed expense...");
  await sleep(500);
  
  const { amount, category } = state.parsed;
  const valid = amount > 0 && ["Food", "Transport"].includes(category);
  
  return { validated: valid };
};

const saveExpense = async (state) => {
  console.log("[saveExpense] Saving to database...");
  await sleep(1000);
  
  const saved = {
    id: Math.floor(Math.random() * 10000),
    ...state.parsed,
    createdAt: new Date().toISOString()
  };
  
  return { saved };
};

const formatResponse = async (state) => {
  console.log("[formatResponse] Formatting final response...");
  await sleep(200);
  
  return {
    finalResponse: `✅ Expense created: ${state.parsed.description} - ₹${state.parsed.amount}`
  };
};

// Build graph
const graph = new StateGraph(ExpenseCreationStateAnnotation);
graph.addNode("parse", parseExpense);
graph.addNode("validate", validateExpense);
graph.addNode("save", saveExpense);
graph.addNode("format", formatResponse);

graph.addEdge(START, "parse");
graph.addEdge("parse", "validate");

// Conditional: Only save if valid
graph.addConditionalEdges(
  "validate",
  (state) => state.validated ? "save" : "format",
  { save: "save", format: "format" }
);

graph.addEdge("save", "format");
graph.addEdge("format", END);

const workflow = graph.compile();

// Stream with progress updates
console.log("Creating expense with streaming...\n");

for await (const chunk of await workflow.stream({
  userMessage: "Add 500 for lunch"
})) {
  const nodeName = Object.keys(chunk)[0];
  const output = chunk[nodeName];
  
  console.log(`\n✓ Completed: ${nodeName}`);
  console.log(`  Output:`, JSON.stringify(output, null, 2));
}

// Output:
// [parseExpense] Parsing user message...
//
// ✓ Completed: parse
//   Output: {
//     "parsed": {
//       "description": "Lunch at restaurant",
//       "amount": 500,
//       "category": "Food"
//     }
//   }
//
// [validateExpense] Validating parsed expense...
//
// ✓ Completed: validate
//   Output: {
//     "validated": true
//   }
//
// [saveExpense] Saving to database...
//
// ✓ Completed: save
//   Output: {
//     "saved": {
//       "id": 7834,
//       "description": "Lunch at restaurant",
//       "amount": 500,
//       "category": "Food",
//       "createdAt": "2026-02-09T15:30:45.123Z"
//     }
//   }
//
// [formatResponse] Formatting final response...
//
// ✓ Completed: format
//   Output: {
//     "finalResponse": "✅ Expense created: Lunch at restaurant - ₹500"
//   }
```

### 31.6 Streaming to Express API (Server-Sent Events)

```javascript
// File: src/routes/chat.js

import express from 'express';
import { intentRouterGraph } from '../graphs/intentRouter.graph.js';

const router = express.Router();

router.post('/stream', async (req, res) => {
  const { message, userId } = req.body;
  const authToken = req.headers.authorization;
  
  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    // Stream graph execution
    for await (const chunk of await intentRouterGraph.stream(
      { userMessage: message },
      {
        configurable: {
          userId,
          authToken,
          thread_id: `user-${userId}-${Date.now()}`
        }
      }
    )) {
      // Send each chunk as SSE event
      const nodeName = Object.keys(chunk)[0];
      const data = chunk[nodeName];
      
      res.write(`event: node-complete\n`);
      res.write(`data: ${JSON.stringify({ node: nodeName, data })}\n\n`);
    }
    
    // Send completion event
    res.write(`event: complete\n`);
    res.write(`data: ${JSON.stringify({ status: "done" })}\n\n`);
    res.end();
    
  } catch (error) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
```

**Frontend (listening to SSE)**:

```javascript
// Frontend: src/app/services/ai.service.ts

streamChat(message: string): EventSource {
  const eventSource = new EventSource(`/ai/stream`, {
    method: 'POST',
    body: JSON.stringify({ message, userId: this.userId }),
    headers: { 'Authorization': `Bearer ${this.authToken}` }
  });
  
  eventSource.addEventListener('node-complete', (event) => {
    const { node, data } = JSON.parse(event.data);
    console.log(`Node ${node} completed:`, data);
    
    // Update UI with progress
    this.updateProgress(node, data);
  });
  
  eventSource.addEventListener('complete', (event) => {
    console.log('Workflow complete');
    eventSource.close();
  });
  
  eventSource.addEventListener('error', (event) => {
    console.error('Stream error:', event);
    eventSource.close();
  });
  
  return eventSource;
}
```

### 31.7 Streaming LLM Responses

**Stream tokens as LLM generates them**

```javascript
import { ChatOpenAI } from "@langchain/openai";

const llmStreamNode = async (state) => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    streaming: true  // Enable streaming
  });
  
  let fullResponse = "";
  
  // Stream tokens
  const stream = await llm.stream(state.userMessage);
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.content);  // Print token immediately
    fullResponse += chunk.content;
  }
  
  return { aiResponse: fullResponse };
};
```

### 31.8 Stream Modes

```javascript
// Mode 1: "values" (default) - Full state after each node
for await (const chunk of await workflow.stream({ input: "..." })) {
  // chunk = { node_name: { ...full state } }
}

// Mode 2: "updates" - Only state updates from each node
for await (const chunk of await workflow.stream(
  { input: "..." },
  { streamMode: "updates" }
)) {
  // chunk = { node_name: { ...only updated fields } }
}

// Mode 3: "debug" - Detailed execution info
for await (const chunk of await workflow.stream(
  { input: "..." },
  { streamMode: "debug" }
)) {
  // chunk = { type: "node_start|node_end", node: "...", ... }
}
```

**✅ You now understand Streaming!**

---

## Chapter 32: Advanced Patterns

### 32.1 Human-in-the-Loop

**Pause execution for human approval**

```javascript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

// Compile with interrupt
const workflow = graph.compile({
  checkpointer,
  interruptBefore: ["approval_node"]  // Pause before this node
});

// First invocation: Runs until approval_node
const result1 = await workflow.invoke(
  { amount: 5000 },
  { configurable: { thread_id: "thread-123" } }
);

console.log("Paused for approval");

// ... Human reviews and approves ...

// Resume execution
const result2 = await workflow.invoke(
  null,  // No new input (resume from checkpoint)
  { configurable: { thread_id: "thread-123" } }
);

console.log("Approved and completed:", result2);
```

#### **Real Example: High-Value Expense Approval**

```javascript
// File: examples/humanInLoopExpense.graph.js

const StateAnnotation = Annotation.Root({
  description: Annotation<string>(),
  amount: Annotation<number>(),
  category: Annotation<string>(),
  requiresApproval: Annotation<boolean>(),
  approved: Annotation<boolean>(),
  finalResponse: Annotation<string>()
});

const checkAmount = async (state) => {
  const requiresApproval = state.amount > 1000;
  return { requiresApproval };
};

const requestApproval = async (state) => {
  console.log(`\n⚠️  HIGH-VALUE EXPENSE DETECTED`);
  console.log(`Amount: ₹${state.amount}`);
  console.log(`Description: ${state.description}`);
  console.log(`\nWaiting for manager approval...\n`);
  
  // This node does nothing - just pauses
  return {};
};

const saveExpense = async (state) => {
  console.log(`✅ Saving expense: ${state.description} - ₹${state.amount}`);
  return {
    finalResponse: `Expense saved: ${state.description} - ₹${state.amount}`
  };
};

const rejectExpense = async (state) => {
  console.log(`❌ Expense rejected: ${state.description}`);
  return {
    finalResponse: `Expense rejected by manager`
  };
};

// Build graph
const graph = new StateGraph(StateAnnotation);
graph.addNode("check_amount", checkAmount);
graph.addNode("request_approval", requestApproval);
graph.addNode("save_expense", saveExpense);
graph.addNode("reject_expense", rejectExpense);

graph.addEdge(START, "check_amount");

// If requires approval → request_approval, else → save directly
graph.addConditionalEdges(
  "check_amount",
  (state) => state.requiresApproval ? "approval" : "save",
  {
    approval: "request_approval",
    save: "save_expense"
  }
);

// After approval, route based on decision
graph.addConditionalEdges(
  "request_approval",
  (state) => state.approved ? "save" : "reject",
  {
    save: "save_expense",
    reject: "reject_expense"
  }
);

graph.addEdge("save_expense", END);
graph.addEdge("reject_expense", END);

// Compile with interrupt BEFORE request_approval
const checkpointer = new MemorySaver();
const workflow = graph.compile({
  checkpointer,
  interruptBefore: ["request_approval"]
});

// ===== Usage =====

// Step 1: Submit expense
const result1 = await workflow.invoke(
  {
    description: "New laptop",
    amount: 50000,
    category: "Equipment"
  },
  { configurable: { thread_id: "expense-789" } }
);

// Graph paused at "request_approval"
console.log("Expense submitted, waiting for approval...");

// Step 2: Manager reviews and updates state
await workflow.updateState(
  { configurable: { thread_id: "expense-789" } },
  { approved: true }  // Manager approves
);

// Step 3: Resume execution
const result2 = await workflow.invoke(
  null,  // No new input
  { configurable: { thread_id: "expense-789" } }
);

console.log(result2.finalResponse);
// "Expense saved: New laptop - ₹50000"
```

### 32.2 Dynamic Graph Modification

**Modify graph structure at runtime** (advanced)

```javascript
// Add/remove nodes based on state
const buildDynamicGraph = (userType) => {
  const graph = new StateGraph(StateAnnotation);
  
  graph.addNode("start", startNode);
  
  if (userType === "admin") {
    graph.addNode("admin_check", adminCheckNode);
    graph.addEdge("start", "admin_check");
    graph.addEdge("admin_check", "end");
  } else {
    graph.addNode("user_check", userCheckNode);
    graph.addEdge("start", "user_check");
    graph.addEdge("user_check", "end");
  }
  
  graph.addNode("end", endNode);
  graph.addEdge("end", END);
  
  return graph.compile();
};

// Use different graph per user
const adminWorkflow = buildDynamicGraph("admin");
const userWorkflow = buildDynamicGraph("user");
```

### 32.3 Subgraphs

**Embed one graph inside another**

```javascript
// Subgraph: Expense validation
const validationGraph = new StateGraph(ValidationStateAnnotation);
validationGraph.addNode("validate_amount", validateAmountNode);
validationGraph.addNode("validate_category", validateCategoryNode);
// ... build validation graph
const validationWorkflow = validationGraph.compile();

// Main graph: Use validation as a node
const mainGraph = new StateGraph(MainStateAnnotation);

mainGraph.addNode("validation", async (state) => {
  // Run subgraph
  const validationResult = await validationWorkflow.invoke({
    amount: state.amount,
    category: state.category
  });
  
  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors
  };
});

mainGraph.addEdge(START, "validation");
// ... rest of main graph
```

### 32.4 Retries with Exponential Backoff

```javascript
const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  result: Annotation<any>(),
  attempts: Annotation<number>({
    default: () => 0
  }),
  lastError: Annotation<string>()
});

const retryableNode = async (state) => {
  const newAttempts = state.attempts + 1;
  
  try {
    const result = await unstableOperation(state.input);
    return {
      result,
      attempts: newAttempts
    };
  } catch (error) {
    console.log(`Attempt ${newAttempts} failed: ${error.message}`);
    
    // Exponential backoff
    const backoffMs = Math.pow(2, newAttempts) * 1000;  // 2s, 4s, 8s
    await sleep(backoffMs);
    
    return {
      lastError: error.message,
      attempts: newAttempts
    };
  }
};

graph.addNode("retryable", retryableNode);

graph.addConditionalEdges(
  "retryable",
  (state) => {
    if (state.result) {
      return "success";  // Got result
    } else if (state.attempts < 3) {
      return "retry";  // Try again
    } else {
      return "failed";  // Give up
    }
  },
  {
    success: END,
    retry: "retryable",  // Loop back
    failed: "error_handler"
  }
);
```

### 32.5 Map-Reduce Pattern

**Process large dataset in parallel, then aggregate**

```javascript
const StateAnnotation = Annotation.Root({
  documents: Annotation<string[]>(),
  
  summaries: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  
  finalSummary: Annotation<string>()
});

// Map: Summarize each document
const summarizeDoc = (docIndex) => async (state) => {
  const doc = state.documents[docIndex];
  const summary = await llm.invoke(`Summarize: ${doc}`);
  return { summaries: [summary.content] };
};

// Add map nodes for each document
for (let i = 0; i < numDocs; i++) {
  graph.addNode(`summarize_${i}`, summarizeDoc(i));
  graph.addEdge(START, `summarize_${i}`);
  graph.addEdge(`summarize_${i}`, "reduce");
}

// Reduce: Combine summaries
const reduceSummaries = async (state) => {
  const combined = state.summaries.join("\n\n");
  const finalSummary = await llm.invoke(`Combine these summaries:\n${combined}`);
  return { finalSummary: finalSummary.content };
};

graph.addNode("reduce", reduceSummaries);
graph.addEdge("reduce", END);
```

### 32.6 Circuit Breaker Pattern

**Stop trying if too many failures**

```javascript
const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  successCount: Annotation<number>({ default: () => 0 }),
  failureCount: Annotation<number>({ default: () => 0 }),
  circuitOpen: Annotation<boolean>({ default: () => false })
});

const checkCircuit = async (state) => {
  // Open circuit if too many failures
  if (state.failureCount >= 5) {
    console.log("❌ Circuit breaker opened (too many failures)");
    return { circuitOpen: true };
  }
  return {};
};

const riskyOperation = async (state) => {
  if (state.circuitOpen) {
    return {
      error: "Circuit breaker is open, rejecting request"
    };
  }
  
  try {
    const result = await unstableAPI(state.input);
    return {
      result,
      successCount: state.successCount + 1,
      failureCount: 0  // Reset on success
    };
  } catch (error) {
    return {
      error: error.message,
      failureCount: state.failureCount + 1
    };
  }
};

graph.addNode("check_circuit", checkCircuit);
graph.addNode("operation", riskyOperation);

graph.addEdge(START, "check_circuit");
graph.addEdge("check_circuit", "operation");

graph.addConditionalEdges(
  "operation",
  (state) => state.circuitOpen ? "circuit_open" : "success",
  {
    circuit_open: END,
    success: END
  }
);
```

### 32.7 Debugging Complex Graphs

```javascript
// Add debug node everywhere
const debugNode = async (state, config) => {
  console.log("\n=== DEBUG ===");
  console.log("Node:", config.runName);
  console.log("State:", JSON.stringify(state, null, 2));
  console.log("=============\n");
  return {};
};

graph.addNode("debug_1", debugNode);
graph.addNode("debug_2", debugNode);

graph.addEdge("some_node", "debug_1");
graph.addEdge("debug_1", "next_node");
graph.addEdge("next_node", "debug_2");
graph.addEdge("debug_2", "final_node");
```

### 32.8 Production Best Practices

#### **1. Always Handle Errors in Nodes**

```javascript
const robustNode = async (state, config) => {
  try {
    const result = await operation(state);
    return { result, status: "success" };
  } catch (error) {
    console.error(`[${config.runName}] Error:`, error);
    return { error: error.message, status: "error" };
  }
};
```

#### **2. Use Timeouts**

```javascript
const timeoutNode = async (state) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 30000)  // 30s
  );
  
  try {
    const result = await Promise.race([
      operation(state),
      timeoutPromise
    ]);
    return { result };
  } catch (error) {
    return { error: error.message };
  }
};
```

#### **3. Log State Transitions**

```javascript
const loggedNode = async (state, config) => {
  console.log(`[${new Date().toISOString()}] Node "${config.runName}" started`);
  
  const result = await operation(state);
  
  console.log(`[${new Date().toISOString()}] Node "${config.runName}" completed`);
  
  return result;
};
```

#### **4. Use LangSmith for Tracing**

```javascript
// All nodes automatically traced
const workflow = graph.compile();

const result = await workflow.invoke(
  { input: "..." },
  {
    tags: ["production", "user-123"],
    metadata: { feature: "expense-creation", version: "1.0.0" }
  }
);
```

**✅ You now understand Advanced Patterns!**

---

## Part 5 Hands-On Challenge

Build a **Multi-Step Expense Processing Workflow** using LangGraph!

### Requirements:

1. **Input**: User message (e.g., "Add 500 for lunch at McDonald's")

2. **Steps**:
   - **Extract**: Parse description, amount, category from message (LLM)
   - **Validate**: Check amount > 0, category valid, description not empty (parallel)
   - **Route**: If invalid → Clarification, if valid → Continue
   - **Enrich**: Add timestamp, calculate tax (parallel)
   - **Save**: Save to "database" (mock)
   - **Notify**: Send confirmation

3. **Features**:
   - Parallel validation (3 validators)
   - Conditional routing (valid vs invalid)
   - State management (accumulate errors)
   - Streaming (see each step)

4. **Bonus**:
   - Add human-in-the-loop for expenses > ₹5000
   - Multi-turn conversation (missing info)
   - Retry logic for mock API failures

### Solution Structure:

```javascript
// State
const ExpenseWorkflowStateAnnotation = Annotation.Root({
  userMessage: Annotation<string>(),
  
  // Extracted info
  description: Annotation<string>(),
  amount: Annotation<number>(),
  category: Annotation<string>(),
  
  // Validation
  errors: Annotation<string[]>({
    reducer: (existing, update) => [...existing, ...update],
    default: () => []
  }),
  isValid: Annotation<boolean>(),
  
  // Enrichment
  timestamp: Annotation<string>(),
  tax: Annotation<number>(),
  total: Annotation<number>(),
  
  // Result
  expenseId: Annotation<number>(),
  finalResponse: Annotation<string>()
});

// Nodes:
// - extractInfo (LLM)
// - validateAmount (parallel)
// - validateCategory (parallel)
// - validateDescription (parallel)
// - checkValidation (aggregator)
// - addTimestamp (parallel)
// - calculateTax (parallel)
// - saveExpense
// - formatResponse

// Edges:
// - START → extractInfo
// - extractInfo → [validateAmount, validateCategory, validateDescription] (parallel)
// - All validators → checkValidation (fan-in)
// - checkValidation → (conditional) → clarification OR [addTimestamp, calculateTax]
// - [addTimestamp, calculateTax] → saveExpense
// - saveExpense → formatResponse
// - formatResponse → END
```

### Test Your Graph:

```javascript
// Valid expense
const result1 = await workflow.invoke({
  userMessage: "Add 500 for lunch at McDonald's"
});
// Should create expense successfully

// Invalid expense (missing amount)
const result2 = await workflow.invoke({
  userMessage: "Food expense"
});
// Should request clarification

// Stream execution
for await (const chunk of await workflow.stream({
  userMessage: "Add 1000 for transport"
})) {
  console.log("Progress:", chunk);
}
```

**🎉 Congratulations! You've mastered LangGraph!**

---

## Next Steps

1. **Build**: Create your own multi-agent system
2. **Experiment**: Combine LangGraph with LangChain agents (tools + workflow)
3. **Optimize**: Add caching, error handling, retries
4. **Monitor**: Integrate LangSmith tracing (Part 6)
5. **Deploy**: Production-ready workflows (Part 7)

Continue to **Part 6: LangSmith** to learn monitoring, evaluation, and production debugging!
