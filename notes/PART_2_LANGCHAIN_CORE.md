# Part 2: LangChain Core
## Tools, Agents, Chains & Memory

**Prerequisites**: Complete Part 1 (Foundations)  
**Concepts Covered**: 60+  
**Reading Time**: 5-6 hours  
**Hands-On**: Build expense agent with tools

---

## Table of Contents

7. [Tools - Extending LLM Capabilities](#chapter-7-tools---extending-llm-capabilities)
8. [Agents - Autonomous Decision Making](#chapter-8-agents---autonomous-decision-making)
9. [Chains - Sequential Operations](#chapter-9-chains---sequential-operations)
10. [Memory - Conversation Context](#chapter-10-memory---conversation-context)

---

## Chapter 7: Tools - Extending LLM Capabilities

### 7.1 What Are Tools?

**Problem**: LLMs can only generate text. They can't:
- ❌ Access databases
- ❌ Call APIs
- ❌ Perform calculations
- ❌ Read current data (weather, stock prices, etc.)

**Solution**: Tools = Functions LLM can call

**Example**: "What's the weather in Paris?"

```
Without Tools:
LLM: "I don't have access to real-time weather data..."

With Weather Tool:
1. LLM: "I should call get_weather(location='Paris')"
2. Tool executes → API call → Returns "Sunny, 22°C"
3. LLM: "The weather in Paris is sunny with a temperature of 22°C."
```

### 7.2 Concept: StructuredTool

**StructuredTool = Base class for creating tools in LangChain**

#### **Basic Structure**

```javascript
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

class MyTool extends StructuredTool {
  // 1. name: Unique identifier (LLM uses this)
  name = "my_tool";
  
  // 2. description: When/how to use (CRITICAL for LLM decision-making)
  description = "Useful for doing X. Input should be Y.";
  
  // 3. schema: Zod validation schema (defines arguments)
  schema = z.object({
    arg1: z.string().describe("Description of arg1"),
    arg2: z.number().describe("Description of arg2")
  });
  
  // 4. _call: Implementation (runs when LLM calls tool)
  async _call(args) {
    // args is validated by schema
    const { arg1, arg2 } = args;
    
    // Do work
    const result = await doSomething(arg1, arg2);
    
    // Return string (LLM receives this)
    return JSON.stringify({ success: true, data: result });
  }
}
```

#### **Key Components Explained**

**1. Name** (LLM Decision Making)
```javascript
name = "create_expense";  // Clear, action-oriented

// ❌ Bad names
name = "tool1";  // Not descriptive
name = "createExpenseInDatabaseAndReturnResult";  // Too long
```

**2. Description** (Most Important!)
```javascript
// ✅ Good: Clear when to use, what inputs needed
description = "Add a new expense to the database. Use when user wants to create/add/record an expense. Input requires amount (number) and category (string).";

// ❌ Bad: Vague
description = "Creates expense";  // LLM won't know when to use this
```

**3. Schema** (Zod Validation)
```javascript
schema = z.object({
  amount: z.number()
    .positive()
    .describe("Expense amount in rupees (e.g., 500)"),
  
  category: z.string()
    .min(1)
    .describe("Expense category like Food, Transport, Entertainment"),
  
  description: z.string()
    .default("")
    .describe("Optional description or notes about expense"),
  
  date: z.string()
    .optional()
    .describe("Date in YYYY-MM-DD format, or 'today', 'yesterday'")
});
```

**Zod Benefits**:
- ✅ Runtime validation (catches errors before execution)
- ✅ Auto-converts to OpenAI function schema
- ✅ Type safety (TypeScript-like types in JavaScript)
- ✅ Descriptive error messages

**4. _call Method** (Implementation)
```javascript
async _call(args) {
  // Args already validated by Zod schema
  
  try {
    // 1. Normalize inputs
    const normalizedDate = normalizeDateToISO(args.date || 'today');
    
    // 2. Business logic
    const validatedAmount = validateAmount(args.amount);
    
    // 3. External API call
    const response = await backendClient.post('/expenses', {
      amount: validatedAmount,
      category: args.category,
      date: normalizedDate
    });
    
    // 4. Return result (must be string)
    return JSON.stringify({
      success: true,
      message: `Added ₹${validatedAmount} expense`,
      expense: response.data.expense
    });
    
  } catch (error) {
    // Handle errors gracefully
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}
```

### 7.3 Real Example: CreateExpenseTool from ai-langx/

```javascript
// File: src/tools/createExpense.tool.js
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createBackendClient } from "../utils/backendClient.js";
import { normalizeCategory } from "../utils/categoryCache.js";
import { normalizeDateToISO } from "../utils/dateNormalizer.js";

export class CreateExpenseTool extends StructuredTool {
  name = "create_expense";
  
  description = `Add a new expense to the database. 
  
Use this tool when the user wants to:
- Create a new expense
- Add an expense
- Record spending
- Log a purchase

Required information:
- amount: Numeric value (positive number)
- category: Expense category name
Optional:
- description: Additional details
- date: When expense occurred

Examples:
"Add 500 for lunch" → amount=500, category="Food", description="lunch", date="today"
"I spent 1200 on groceries yesterday" → amount=1200, category="Groceries", date="yesterday"`;

  schema = z.object({
    amount: z.number()
      .positive()
      .describe("Expense amount in rupees. Must be a positive number. Example: 500"),
    
    category: z.string()
      .min(1)
      .describe("Category name from user's message. Examples: Food, Transport, Entertainment, Groceries, Shopping"),
    
    description: z.string()
      .default("")
      .describe("Optional description or notes about the expense. Extract from user's message if available."),
    
    date: z.string()
      .optional()
      .describe('Date of expense. Can be "today", "yesterday", or ISO format YYYY-MM-DD. Default is today.')
  });
  
  // Constructor for dependency injection
  constructor(authToken, context = {}) {
    super();
    this.authToken = authToken;
    this.userId = context.userId;
    this.traceId = context.traceId;
  }
  
  async _call(args) {
    try {
      // 1. Normalize date
      const normalizedDate = normalizeDateToISO(args.date || 'today');
      
      // 2. Normalize category (find matching category from backend)
      const normalizedCategory = await normalizeCategory(
        args.category,
        this.authToken
      );
      
      if (!normalizedCategory) {
        return JSON.stringify({
          success: false,
          error: `Category "${args.category}" not found. Available categories: Food, Transport, Shopping, Entertainment, Bills, Healthcare, Education, Other.`
        });
      }
      
      // 3. Validate amount
      if (args.amount <= 0) {
        return JSON.stringify({
          success: false,
          error: "Amount must be positive"
        });
      }
      
      if (args.amount > 1000000) {
        return JSON.stringify({
          success: false,
          error: "Amount too large. Please confirm if this is correct."
        });
      }
      
      // 4. Call backend API
      const backendClient = createBackendClient(this.authToken);
      const response = await backendClient.post('/expenses', {
        amount: args.amount,
        category_id: normalizedCategory.id,
        description: args.description || `Expense for ${normalizedCategory.name}`,
        date: normalizedDate
      });
      
      // 5. Check response
      if (response.data.success) {
        const expense = response.data.expense;
        return JSON.stringify({
          success: true,
          message: `Successfully added ₹${args.amount} for ${normalizedCategory.name} on ${normalizedDate}.`,
          expense: {
            id: expense.id,
            amount: expense.amount,
            category: normalizedCategory.name,
            description: expense.description,
            date: expense.date
          }
        });
      } else {
        return JSON.stringify({
          success: false,
          error: response.data.error || 'Failed to create expense'
        });
      }
      
    } catch (error) {
      console.error('[CreateExpenseTool] Error:', error);
      
      // Return detailed error for debugging
      return JSON.stringify({
        success: false,
        error: `Failed to create expense: ${error.message}`,
        details: error.response?.data || {}
      });
    }
  }
}

// Usage
const tool = new CreateExpenseTool("jwt-token-here", {
  userId: 123,
  traceId: "trace-abc"
});

const result = await tool._call({
  amount: 500,
  category: "Food",
  description: "Lunch at cafe",
  date: "today"
});

console.log(result);
// {"success": true, "message": "Successfully added ₹500...", "expense": {...}}
```

### 7.4 Concept: Zod Schema

**Zod = Runtime type validation library** (TypeScript-like types for JavaScript)

#### **Basic Types**

```javascript
import { z } from "zod";

// String
z.string()
z.string().min(3)  // At least 3 characters
z.string().max(100)  // At most 100 characters
z.string().email()  // Must be email format
z.string().url()  // Must be URL format
z.string().regex(/^\d{3}$/)  // Must match pattern

// Number
z.number()
z.number().int()  // Integer only
z.number().positive()  // > 0
z.number().negative()  // < 0
z.number().min(0)  // >= 0
z.number().max(1000)  // <= 1000

// Boolean
z.boolean()

// Date
z.date()
z.string().datetime()  // ISO datetime string

// Array
z.array(z.string())  // Array of strings
z.array(z.number()).min(1).max(10)  // 1-10 numbers

// Object
z.object({
  name: z.string(),
  age: z.number()
})

// Enum
z.enum(["Food", "Transport", "Shopping"])

// Optional
z.string().optional()  // string | undefined
z.number().nullable()  // number | null

// Default
z.string().default("default value")
z.number().default(0)

// Transform
z.string().transform(s => s.toUpperCase())
z.string().transform(s => parseInt(s))
```

#### **Complex Schema Example**

```javascript
const ExpenseSchema = z.object({
  // Required fields
  amount: z.number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  
  category: z.enum([
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills",
    "Healthcare",
    "Education",
    "Other"
  ]),
  
  // Optional fields
  description: z.string()
    .max(500, "Description too long")
    .default(""),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .default(() => new Date().toISOString().split('T')[0]),
  
  // Nested object
  metadata: z.object({
    source: z.string(),
    tags: z.array(z.string()).optional()
  }).optional(),
  
  // Conditional validation
  recurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional()
}).refine(
  (data) => {
    // If recurring=true, frequency is required
    if (data.recurring && !data.frequency) {
      return false;
    }
    return true;
  },
  {
    message: "Frequency required when recurring is true"
  }
);

// Usage
const result = ExpenseSchema.safeParse({
  amount: 500,
  category: "Food",
  description: "Lunch",
  date: "2026-02-09"
});

if (result.success) {
  console.log("Valid:", result.data);
} else {
  console.error("Invalid:", result.error.errors);
  // [{ path: ["amount"], message: "Amount must be positive" }]
}
```

### 7.5 Concept: Tool Context Injection

**Problem**: Tools need access to user-specific data (auth token, userId, etc.)

**Solution**: Pass context via constructor (Dependency Injection pattern)

```javascript
// File: src/tools/index.js
import { CreateExpenseTool } from './createExpense.tool.js';
import { ListExpensesTool } from './listExpenses.tool.js';
import { ModifyExpenseTool } from './modifyExpense.tool.js';
import { DeleteExpenseTool } from './deleteExpense.tool.js';
import { ClearExpensesTool } from './clearExpenses.tool.js';

export const createToolsWithContext = (authToken, context = {}) => {
  // Create tool instances with injected context
  return [
    new CreateExpenseTool(authToken, context),
    new ListExpensesTool(authToken, context),
    new ModifyExpenseTool(authToken, context),
    new DeleteExpenseTool(authToken, context),
    new ClearExpensesTool(authToken, context)
  ];
};

// Usage in request handler
// File: src/routes/chat.js
router.post('/chat', authMiddleware, async (req, res) => {
  const authToken = req.token;
  const userId = req.user.userId;
  const traceId = generateTraceId();
  
  // Create tools with request-specific context
  const tools = createToolsWithContext(authToken, {
    userId,
    traceId,
    sessionId: req.sessionId
  });
  
  // Use tools in agent
  const agent = await createExpenseAgent(authToken, { userId, traceId });
  const result = await agent.invoke({ input: req.body.message });
  
  res.json({ reply: result.output });
});
```

**Benefits**:
- ✅ Security: Each request has own auth token
- ✅ Isolation: User can only access own data
- ✅ Tracing: Each request has unique trace ID
- ✅ Testability: Easy to mock context in tests

### 7.6 Concept: Multiple Tools

**Agent can choose from multiple tools** based on user query

```javascript
// File: src/tools/index.js (continued)

// 5 tools for expense operations
class CreateExpenseTool extends StructuredTool {
  name = "create_expense";
  description = "Add a new expense...";
  // ... implementation
}

class ListExpensesTool extends StructuredTool {
  name = "list_expenses";
  description = "List expenses with optional filters (date range, category, amount)...";
  schema = z.object({
    dateFrom: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("End date (YYYY-MM-DD)"),
    category: z.string().optional().describe("Filter by category"),
    minAmount: z.number().optional().describe("Minimum amount"),
    maxAmount: z.number().optional().describe("Maximum amount")
  });
  // ... implementation
}

class ModifyExpenseTool extends StructuredTool {
  name = "modify_expense";
  description = "Update an existing expense's details...";
  schema = z.object({
    expenseId: z.number().describe("ID of expense to modify"),
    amount: z.number().optional().describe("New amount"),
    category: z.string().optional().describe("New category"),
    description: z.string().optional().describe("New description"),
    date: z.string().optional().describe("New date")
  });
  // ... implementation
}

class DeleteExpenseTool extends StructuredTool {
  name = "delete_expense";
  description = "Delete a specific expense by ID...";
  schema = z.object({
    expenseId: z.number().describe("ID of expense to delete")
  });
  // ... implementation
}

class ClearExpensesTool extends StructuredTool {
  name = "clear_expenses";
  description = "Delete all expenses in a date range. Use with caution!...";
  schema = z.object({
    dateFrom: z.string().describe("Start date (YYYY-MM-DD)"),
    dateTo: z.string().describe("End date (YYYY-MM-DD)"),
    confirm: z.boolean().default(false).describe("User must confirm")
  });
  // ... implementation
}

// Agent receives all 5 tools
const tools = createToolsWithContext(authToken, { userId });

// LLM automatically selects appropriate tool:
// "Add 500 for lunch" → create_expense
// "Show my expenses" → list_expenses
// "Delete expense 123" → delete_expense
// "Change lunch to 600" → modify_expense (needs ID from previous context)
// "Clear all expenses from last week" → clear_expenses
```

### 7.7 Concept: Tool Error Handling

**Tools should handle errors gracefully** and return useful messages

```javascript
async _call(args) {
  try {
    // Attempt operation
    const result = await riskyOperation(args);
    return JSON.stringify({ success: true, data: result });
    
  } catch (error) {
    // Log for debugging (server-side)
    console.error(`[${this.name}] Error:`, error);
    
    // Return user-friendly error (LLM sees this)
    if (error.response?.status === 404) {
      return JSON.stringify({
        success: false,
        error: "Resource not found. Please check the ID."
      });
    }
    
    if (error.response?.status === 401) {
      return JSON.stringify({
        success: false,
        error: "Authentication failed. Please log in again."
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return JSON.stringify({
        success: false,
        error: "Backend service unavailable. Please try again later."
      });
    }
    
    // Generic error
    return JSON.stringify({
      success: false,
      error: `Operation failed: ${error.message}`
    });
  }
}
```

### 7.8 Concept: DynamicTool (Simpler Alternative)

**DynamicTool = Quick tool without class** (for simple cases)

```javascript
import { DynamicTool } from "@langchain/core/tools";

const calculatorTool = new DynamicTool({
  name: "calculator",
  description: "Useful for math calculations. Input should be a math expression like '2+2' or '10*5'.",
  func: async (input) => {
    try {
      // Evaluate expression (use a safe eval library in production!)
      const result = eval(input);
      return String(result);
    } catch (error) {
      return `Invalid expression: ${error.message}`;
    }
  }
});

// Usage
const result = await calculatorTool.call("25 * 4");
console.log(result);  // "100"
```

**When to use**:
- ✅ Simple tools (no validation needed)
- ✅ Prototyping
- ✅ Tools with string input only

**When to use StructuredTool instead**:
- ✅ Multiple arguments
- ✅ Need validation (Zod schemas)
- ✅ Complex logic
- ✅ Production code (better structure)

### 7.9 Tool Design Best Practices

#### **1. Clear, Action-Oriented Names**

```javascript
// ✅ Good names
"create_expense", "list_expenses", "calculate_total", "get_weather"

// ❌ Bad names
"expense_tool", "tool1", "handler", "process"
```

#### **2. Detailed Descriptions**

```javascript
// ✅ Good description
description = `Add a new expense to the database.

Use when user wants to:
- Create/add/record an expense
- Log a purchase
- Track spending

Required: amount (number), category (string)
Optional: description, date

Examples:
- "Add 500 for lunch" → amount=500, category="Food"
- "I spent 300 on taxi" → amount=300, category="Transport"`;

// ❌ Bad description
description = "Creates an expense";
```

#### **3. Descriptive Schema Fields**

```javascript
// ✅ Good: Clear descriptions
schema = z.object({
  amount: z.number().describe("Expense amount in rupees (e.g., 500, 1200.50)"),
  category: z.string().describe("Category name like Food, Transport, Shopping"),
  date: z.string().describe('Date in YYYY-MM-DD format, or "today"/"yesterday"')
});

// ❌ Bad: No descriptions
schema = z.object({
  amount: z.number(),
  category: z.string(),
  date: z.string()
});
```

#### **4. Return JSON Strings**

```javascript
// ✅ Good: Structured JSON
return JSON.stringify({
  success: true,
  message: "Added ₹500 for Food",
  expense: { id: 123, amount: 500 }
});

// ❌ Bad: Plain text (harder for LLM to parse)
return "I added 500 rupees for Food with ID 123";
```

#### **5. Include Success/Error Status**

```javascript
// ✅ Good: Clear status
return JSON.stringify({
  success: true,
  message: "Operation completed"
});

// Or
return JSON.stringify({
  success: false,
  error: "Validation failed: Amount must be positive"
});

// ❌ Bad: Ambiguous
return JSON.stringify({
  result: "done"  // Success or error? Not clear.
});
```

### 7.10 Potential AI-LangX Tool Extensions

**Not yet implemented, but easy to add:**

#### **GetTotalTool**

```javascript
class GetTotalTool extends StructuredTool {
  name = "get_total";
  description = "Calculate total expenses for a date range or category.";
  
  schema = z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional()
  });
  
  async _call(args) {
    const expenses = await listExpenses(args, this.authToken);
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return JSON.stringify({
      success: true,
      total,
      count: expenses.length,
      filters: args
    });
  }
}
```

#### **GetCategorySummaryTool**

```javascript
class GetCategorySummaryTool extends StructuredTool {
  name = "get_category_summary";
  description = "Get spending breakdown by category for a date range.";
  
  schema = z.object({
    dateFrom: z.string().describe("Start date"),
    dateTo: z.string().describe("End date")
  });
  
  async _call(args) {
    const expenses = await listExpenses(args, this.authToken);
    
    const summary = {};
    expenses.forEach(exp => {
      if (!summary[exp.category]) {
        summary[exp.category] = { total: 0, count: 0 };
      }
      summary[exp.category].total += exp.amount;
      summary[exp.category].count++;
    });
    
    return JSON.stringify({
      success: true,
      summary,
      grandTotal: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    });
  }
}
```

#### **ExportExpensesTool**

```javascript
class ExportExpensesTool extends StructuredTool {
  name = "export_expenses";
  description = "Export expenses to CSV or JSON format.";
  
  schema = z.object({
    format: z.enum(["csv", "json"]),
    dateFrom: z.string(),
    dateTo: z.string()
  });
  
  async _call(args) {
    const expenses = await listExpenses({
      dateFrom: args.dateFrom,
      dateTo: args.dateTo
    }, this.authToken);
    
    if (args.format === "csv") {
      const csv = convertToCSV(expenses);
      const filename = `expenses_${Date.now()}.csv`;
      await saveFile(filename, csv);
      return JSON.stringify({
        success: true,
        filename,
        path: `/exports/${filename}`,
        recordCount: expenses.length
      });
    }
    // ... JSON export
  }
}
```

**✅ You now understand LangChain Tools!**

---

## Chapter 8: Agents - Autonomous Decision Making

### 8.1 What Are Agents?

**Agent = LLM that can use tools autonomously** (decides which tool to call, when to call it, and with what arguments)

Think of an agent as:
- 🤖 **Autonomous assistant** that solves tasks independently
- 🔧 **Tool user** that knows when to use which tool
- 🔄 **Loop executor** that repeats until task is complete

#### **Without Agent (Manual)**

```javascript
// You decide everything
const userMessage = "Add 500 for lunch, then show me today's total";

// Step 1: Manually call create expense
const createResult = await createExpenseTool._call({
  amount: 500,
  category: "Food",
  description: "lunch"
});

// Step 2: Manually call list expenses
const listResult = await listExpensesTool._call({
  dateFrom: "2026-02-09",
  dateTo: "2026-02-09"
});

// Step 3: Manually calculate total
const total = JSON.parse(listResult).expenses.reduce((sum, e) => sum + e.amount, 0);

// Step 4: Manually format response
const response = `Added ₹500 for lunch. Your total for today is ₹${total}.`;
```

#### **With Agent (Automatic)**

```javascript
// Agent decides everything
const agent = new AgentExecutor({ agent, tools });
const result = await agent.invoke({
  input: "Add 500 for lunch, then show me today's total"
});

//Behind the scenes:
// 1. Agent thinks: "I need to create an expense first"
// 2. Agent calls: create_expense(amount=500, category="Food"...)
// 3. Agent sees result: {"success": true, "expense": {...}}
// 4. Agent thinks: "Now I need to list today's expenses"
// 5. Agent calls: list_expenses(dateFrom="2026-02-09", dateTo="2026-02-09")
// 6. Agent sees result: {"expenses": [...], "total": 1500}
// 7. Agent thinks: "Task complete, I'll respond to user"
// 8. Agent responds: "Added ₹500 for lunch. Your total for today is ₹1,500."

console.log(result.output);
// "Added ₹500 for lunch. Your total for today is ₹1,500."
```

### 8.2 Concept: Agent Loop (ReAct Pattern)

**ReAct = Reasoning + Acting** (Agent thinks then acts, repeatedly)

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT LOOP                            │
└─────────────────────────────────────────────────────────┘

User Input: "Add 500 for lunch then show today's total"
                        │
                        ──────────────────────────────────────────────────────────────────────────┐
                                                                                                   │
                                                                                                   ▼
┌─ ITERATION 1────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  🤔 REASON (LLM Thinks):                                                                            │
│     "The user wants to add an expense. I should use create_expense tool."                           │
│                                                                                                      │
│  🔧 ACT (Call Tool):                                                                                │
│     Tool: create_expense                                                                             │
│     Args: {amount: 500, category: "Food", description: "lunch", date: "today"}                      │
│                                                                                                      │
│  📊 OBSERVE (Tool Result):                                                                          │
│     {"success": true, "message": "Added ₹500 for Food...", "expense": {...}}                        │
│                                                                                                      │
│  🤔 REASON (LLM Thinks):                                                                            │
│     "Expense created successfully. Now I need to show today's total.                               │
│      I should use list_expenses to get all today's expenses."                                       │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                  │
                                                                  ▼
┌─ ITERATION 2────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  🔧 ACT (Call Tool):                                                                                │
│     Tool: list_expenses                                                                              │
│     Args: {dateFrom: "2026-02-09", dateTo: "2026-02-09"}                                            │
│                                                                                                      │
│  📊 OBSERVE (Tool Result):                                                                          │
│     {"expenses": [{id:123, amount:500}, {id:124, amount:300}], "total": 800}                       │
│                                                                                                      │
│  🤔 REASON (LLM Thinks):                                                                            │
│     "I have both required pieces of information:                                                    │
│      1. Added ₹500 for lunch (from first call)                                                      │
│      2. Today's total is ₹800 (from second call)                                                    │
│      I can now provide the final answer to the user."                                               │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                  │
                                                                  ▼
┌─ FINAL RESPONSE ──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                      │
│  💬 RESPOND (No Tool Calls):                                                                        │
│     "✅ I've added ₹500 for lunch. Your total expenses for today are ₹800."                        │
│                                                                                                      │
│  ✅ DONE (Agent stops - no more tool calls)                                                         │
│                                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- Agent **loops** until task is complete
- Each iteration: **Reason → Act → Observe**
- Agent stops when **no more tools needed**
- Maximum iterations set (default: 15) to prevent infinite loops

### 8.3 Concept: AgentExecutor

**AgentExecutor = Manages the agent loop** (LangChain's agent runner)

```javascript
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";

// 1. Create LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7
});

// 2. Create tools
const tools = [createExpenseTool, listExpensesTool, deleteExpenseTool];

// 3. Create agent
const agent = await createOpenAIToolsAgent({
  llm,
  tools,
  prompt  // Chat prompt template
});

// 4. Create executor (runs the loop)
const executor = new AgentExecutor({
  agent,
  tools,
  
  // Configuration
  maxIterations: 5,  // Max tool calls (prevent infinite loops)
  returnIntermediateSteps: true,  // Include reasoning in result
  handleParsingErrors: true,  // Graceful error handling
  verbose: true  // Log execution (for debugging)
});

// 5. Execute
const result = await executor.invoke({
  input: "Add 500 for lunch"
});

console.log(result);
// {
//   output: "✅ Added ₹500 for Food (lunch) on 2026-02-09.",
//   intermediateSteps: [
//     {
//       action: { tool: "create_expense", toolInput: {...} },
//       observation: '{"success": true, ...}'
//     }
//   ]
// }
```

### 8.4 Real Example: Expense Agent from ai-langx/

```javascript
// File: src/agents/expense.agent.js
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { createAgentPrompt } from "../prompts/system.prompt.js";
import { createToolsWithContext } from "../tools/index.js";
import { getTraceTags, getTraceMetadata } from "../config/langsmith.config.js";

export const createExpenseAgent = async (authToken, context = {}) => {
  const { userId, traceId } = context;
  
  // 1. Create LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,  // Natural, varied responses
    
    // LangSmith tracing
    tags: getTraceTags('transactional', userId),
    metadata: getTraceMetadata(traceId, userId, {
      feature: 'expense-agent'
    })
  });
  
  // 2. Create tools with context
  const tools = createToolsWithContext(authToken, context);
  
  // 3. Create prompt
  const prompt = createAgentPrompt();
  
  // 4. Create agent
  const agent = await createOpenAIToolsAgent({
    llm,
    tools,
    prompt
  });
  
  // 5. Create executor
  return new AgentExecutor({
    agent,
    tools,
    
    // Safety limits
    maxIterations: 5,  // Prevent runaway loops
    maxExecutionTime: 60000,  // 60 second timeout
    
    // Debugging
    returnIntermediateSteps: true,  // Include tool calls in result
    handleParsingErrors: true,  // Handle malformed tool calls
    
    // Logging (only in development)
    verbose: process.env.NODE_ENV === 'development'
  });
};

// Usage in route handler
// File: src/routes/chat.js
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const authToken = req.token;
    const userId = req.user.userId;
    const traceId = generateTraceId();
    
    // Create agent
    const agent = await createExpenseAgent(authToken, {
      userId,
      traceId,
      sessionId: req.sessionID
    });
    
    // Execute
    const result = await agent.invoke({
      input: message,
      chat_history: history
    });
    
    // Return output
    res.json({
      reply: result.output,
      // Optional: Include tool calls for debugging
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          intermediateSteps: result.intermediateSteps
        }
      })
    });
    
  } catch (error) {
    console.error('[Chat] Error:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout. Operation took too long.'
      });
    }
    
    if (error.message.includes('max iterations')) {
      return res.status(400).json({
        error: 'Too many operations. Please simplify your request.'
      });
    }
    
    res.status(500).json({
      error: 'Failed to process request'
    });
  }
});
```

### 8.5 Concept: Agent Types

LangChain supports multiple agent types. **ai-langx/ uses OpenAI Tools Agent** (recommended).

#### **1. OpenAI Tools Agent** (Recommended ✅)

```javascript
import { createOpenAIToolsAgent } from "langchain/agents";

const agent = await createOpenAIToolsAgent({ llm, tools, prompt });
```

**Features**:
- ✅ Uses OpenAI's function calling (most reliable)
- ✅ Parallel tool calling (multiple tools at once)
- ✅ Best performance
- ✅ Works with GPT-4, GPT-4o, GPT-4o-mini, GPT-3.5-turbo

**When to use**: Always (unless using non-OpenAI models)

#### **2. ReAct Agent**

```javascript
import { createReactAgent } from "langchain/agents";

const agent = await createReactAgent({ llm, tools, prompt });
```

**Features**:
- ✅ Works with any LLM (not just OpenAI)
- ✅ Explicit reasoning in text
- ❌ Slower (reasoning in text is verbose)
- ❌ Less reliable parsing

**When to use**: Using non-OpenAI models (Anthropic, Google, etc.)

**Example output**:
```
Thought: I need to create an expense
Action: create_expense
Action Input: {"amount": 500, "category": "Food"}
Observation: {"success": true, ...}
Thought: I have created the expense, I can now respond
Final Answer: Added ₹500 for Food.
```

#### **3. Conversational Agent**

```javascript
import { createConversationalAgent } from "langchain/agents";

const agent = await createConversationalAgent({ llm, tools, prompt, memory });
```

**Features**:
- ✅ Built-in conversation memory
- ✅ Remembers context across turns
- ❌ Uses older prompt format

**When to use**: Multi-turn conversations with memory (deprecated - use OpenAI Tools Agent + manual memory instead)

#### **4. Structured Chat Agent**

```javascript
import { createStructuredChatAgent } from "langchain/agents";

const agent = await createStructuredChatAgent({ llm, tools, prompt });
```

**Features**:
- ✅ Structured input/output
- ✅ Works with chat models
- ❌ Less common

**When to use**: Need structured I/O without function calling

### 8.6 Concept: Agent Configuration

#### **maxIterations** (Safety Limit)

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 5  // Stop after 5 tool calls
});

// User: "Add 500 for lunch then show today's total"
// Iteration 1: create_expense (Tool call #1)
// Iteration 2: list_expenses (Tool call #2)
// Response: "Added ₹500. Today's total is ₹800." ← 2 iterations, well under limit

// User: "Add 100, then 200, then 300, then 400, then 500, then 600, then show total"
// Iteration 1: create_expense(100)
// Iteration 2: create_expense(200)
// Iteration 3: create_expense(300)
// Iteration 4: create_expense(400)
// Iteration 5: create_expense(500) ← Max reached!
// Response: "I've added 5 expenses but hit the operation limit. Please continue in a new message."
```

**Typical values**:
- **3-5**: Standard applications
- **10-15**: Complex multi-step workflows
- **1**: Single tool call only

#### **maxExecutionTime** (Timeout)

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  maxExecutionTime: 30000  // 30 seconds
});

// If execution exceeds 30s, throws timeout error
```

**Typical values**:
- **10s**: Simple operations
- **30s**: Standard (ai-langx/ uses 60s)
- **120s**: Complex reconciliation/processing

#### **returnIntermediateSteps** (Debugging)

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  returnIntermediateSteps: true  // Include tool calls in result
});

const result = await executor.invoke({ input: "Add 500 for lunch" });

console.log(result.intermediateSteps);
// [
//   {
//     action: {
//       tool: "create_expense",
//       toolInput: { amount: 500, category: "Food", description: "lunch" },
//       log: "I should use create_expense..."
//     },
//     observation: '{"success": true, "expense": {...}}'
//   }
// ]
```

**Use cases**:
- ✅ Development/debugging
- ✅ Understanding agent decisions
- ✅ Logging/analytics
- ❌ Production (adds response size)

#### **handleParsingErrors** (Robustness)

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  handleParsingErrors: true  // Don't crash on malformed tool calls
});

// If LLM returns invalid JSON:
// Without: Throws error, crashes
// With: Sends error back to LLM, asks it to fix
```

**Always use**: `true` (more robust)

#### **verbose** (Logging)

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  verbose: true  // Log all steps to console
});

// Console output:
// [Agent] Invoking with input: "Add 500 for lunch"
// [Agent] LLM output: I should call create_expense...
// [Tool] Calling create_expense with {amount: 500, ...}
// [Tool] Result: {"success": true, ...}
// [Agent] Final answer: Added ₹500 for Food.
```

**Use cases**:
- ✅ Development (understand flow)
- ❌ Production (clutters logs)

### 8.7 Concept: Agent Prompt (System Instructions)

**Agent prompt defines behavior** - critical for good performance

```javascript
// File: src/prompts/system.prompt.js
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const createAgentPrompt = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return ChatPromptTemplate.fromMessages([
    // SYSTEM: Instructions (who you are, what you can do)
    ["system", `You are an AI expense tracking assistant.

CURRENT DATE: ${currentDate}

YOUR TOOLS:
1. create_expense - Add new expense
2. list_expenses - List/filter expenses
3. modify_expense - Update existing expense
4. delete_expense - Remove expense
5. clear_expenses - Delete multiple expenses

RULES:
✅ ALWAYS use tools (never fake results)
✅ Confirm ambiguous requests ("Did you mean Food or Groceries?")
✅ Use ISO dates (YYYY-MM-DD)
✅ "today" = ${currentDate}, "yesterday" = ${getPreviousDate(currentDate)}
✅ Be concise and friendly
✅ If tool fails, explain error clearly

EXAMPLES:
User: "Add 500 for lunch"
You: [Call create_expense] → "✅ Added ₹500 for Food."

User: "What did I spend on transport last week?"
You: [Call list_expenses with date range + category filter] → "You spent ₹450 on Transport last week (2 expenses)."

User: "Delete expense 123"
You: [Call delete_expense] → "✅ Deleted expense #123."

Let's help manage expenses!`],
    
    // PLACEHOLDER: Conversation history (dynamic)
    ["placeholder", "{chat_history}"],
    
    // HUMAN: Current user input
    ["human", "{input}"],
    
    // PLACEHOLDER: Agent scratchpad (tool calls + results)
    ["placeholder", "{agent_scratchpad}"]
  ]);
};
```

**Key sections**:

1. **Identity**: Who the agent is
2. **Capabilities**: Which tools available
3. **Rules**: How to behave
4. **Examples**: Show desired behavior (few-shot learning)
5. **Placeholders**: Dynamic content (history, input, scratchpad)

### 8.8 Concept: Agent Scratchpad

**Agent scratchpad = Memory of tool calls within current request**

```javascript
// User: "Add 500 for lunch then show today's total"

// After iteration 1 (create_expense):
agent_scratchpad = [
  {
    role: "assistant",
    content: "",
    tool_calls: [{
      id: "call_abc",
      function: { name: "create_expense", arguments: '{"amount": 500, ...}' }
    }]
  },
  {
    role: "tool",
    tool_call_id: "call_abc",
    content: '{"success": true, "expense": {...}}'
  }
]

// After iteration 2 (list_expenses):
agent_scratchpad = [
  // ... previous messages ...
  {
    role: "assistant",
    content: "",
    tool_calls: [{
      id: "call_def",
      function: { name: "list_expenses", arguments: '{"dateFrom": "2026-02-09", ...}' }
    }]
  },
  {
    role: "tool",
    tool_call_id: "call_def",
    content: '{"expenses": [...], "total": 800}'
  }
]

// LLM sees all previous tool calls and results
// Allows it to reference previous information
```

**Benefits**:
- ✅ Agent remembers tool results within request
- ✅ Can reference previous tool outputs
- ✅ Enables multi-step reasoning

### 8.9 Concept: Parallel Tool Calling

**Parallel = Call multiple tools simultaneously** (faster!)

```javascript
// User: "Add 500 for lunch and 300 for taxi"

// Sequential (slow):
// 1. create_expense(500, "Food") - 1.2s
// 2. create_expense(300, "Transport") - 1.2s
// Total: 2.4s

// Parallel (fast):
// 1. create_expense(500, "Food") } 
//    create_expense(300, "Transport") } Both at same time - 1.2s
// Total: 1.2s (2x faster!)

// GPT-4 and GPT-4o support parallel tool calling automatically
const result = await executor.invoke({
  input: "Add 500 for lunch and 300 for taxi"
});

// LLM returns multiple tool_calls in one response:
// tool_calls: [
//   { name: "create_expense", arguments: {amount: 500, category: "Food"} },
//   { name: "create_expense", arguments: {amount: 300, category: "Transport"} }
// ]

// AgentExecutor executes both in parallel (if safe)
```

**Automatic with**:
- ✅ GPT-4
- ✅ GPT-4o / GPT-4o-mini
- ✅ createOpenAIToolsAgent()
- ❌ GPT-3.5-turbo (sequential only)

### 8.10 Concept: Early Stopping

**Early stopping method** - How to stop when max iterations reached

```javascript
const executor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 3,
  earlyStoppingMethod: "force"  // or "generate"
});
```

**Methods**:

1. **"force"** (Default - Immediate stop)
```javascript
earlyStoppingMethod: "force"

// After 3 iterations:
// Response: "[Agent stopped due to iteration limit]"
// ↑ Abrupt, no clean response
```

2. **"generate"** (Graceful stop)
```javascript
earlyStoppingMethod: "generate"

// After 3 iterations:
// LLM generates response based on progress so far
// Response: "I've completed the first 3 operations. Please continue with a new message for the remaining tasks."
// ↑ User-friendly
```

**Recommendation**: Use `"generate"` for better UX

### 8.11 Common Agent Patterns

#### **Pattern 1: Single Tool Call**

```javascript
// User: "Add 500 for lunch"
// Agent: create_expense(500, "Food") → Response

// Simple, direct
```

#### **Pattern 2: Sequential Multi-Tool**

```javascript
// User: "Add 500 for lunch then show me today's total"
// Agent:
//   1. create_expense(500, "Food")
//   2. list_expenses(date="today")
//   3. Calculate total, respond

// Each tool depends on previous
```

#### **Pattern 3: Conditional Logic**

```javascript
// User: "If I have more than 1000 in expenses today, show breakdown by category"
// Agent:
//   1. list_expenses(date="today")
//   2. Calculate total
//   3. If > 1000: Call get_category_summary
//   4. Else: Respond with just total

// Agent decides based on data
```

#### **Pattern 4: Correction/Validation**

```javascript
// User: "Add 5000000 for lunch"
// Agent:
//   1. Calls create_expense(5000000, "Food")
//   2. Gets error: "Amount too large, please confirm"
//   3. Responds: "Are you sure about ₹5,000,000 for lunch? That's very high. Please confirm."

// Agent doesn't blindly execute
```

#### **Pattern 5: Disambiguation**

```javascript
// User: "Show me last week"
// Agent thinks: "Which week? This is ambiguous."
// Agent: "Do you mean last week (Feb 2-8) or the past 7 days?"

// No tool called, asks for clarification first
```

### 8.12 Agent vs Custom Code

**When to use Agent**:
- ✅ Natural language input
- ✅ Complex, multi-step tasks
- ✅ User intent varies
- ✅ Need flexibility

**When to use Custom Code**:
- ✅ Fixed workflow (always same steps)
- ✅ Performance critical (agent adds LLM latency)
- ✅ Deterministic (must be exact, no variance)
- ✅ Simple operations

**Example**:

```javascript
// ❌ Don't use agent for simple API wrapper
router.get('/expenses', async (req, res) => {
  // Just call API directly, no LLM needed
  const expenses = await backendClient.get('/expenses');
  res.json(expenses);
});

// ✅ Use agent for natural language interface
router.post('/ai/chat', async (req, res) => {
  // User input varies: "Add 500", "Show my expenses", "Delete last one"
  // Agent handles all variations
  const agent = await createExpenseAgent(token, context);
  const result = await agent.invoke({ input: req.body.message });
  res.json({ reply: result.output });
});
```

**✅ You now understand LangChain Agents!**

---

## Chapter 9: Chains - Sequential Operations

### 9.1 What Are Chains?

**Chain = Connected sequence of operations** (each step feeds into next)

Think of chains as:
- 🔗 **Pipeline**: Data flows through stages
- 📦 **Composable**: Combine smaller pieces into larger workflows
- 🎯 **Deterministic**: Same input → Same sequence

#### **Simple Example: Email Summary Chain**

```
Input: Long email
   ↓
Step 1: LLM summarizes
   ↓
Step 2: LLM translates to Spanish
   ↓
Output: Spanish summary
```

### 9.2 Concept: LLMChain (Basic Building Block)

**LLMChain = Prompt + LLM** (simplest chain)

```javascript
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

// 1. Create prompt
const prompt = PromptTemplate.fromTemplate(
  "Summarize this expense report:\n\n{report}"
);

// 2. Create LLM
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// 3. Create chain
const chain = new LLMChain({ llm, prompt });

// 4. Run chain
const result = await chain.call({
  report: "Lunch: $15, Taxi: $10, Groceries: $50"
});

console.log(result.text);
// "Total spending: $75 across 3 categories (Food, Transport, Groceries)"
```

**LLMChain Components**:
- **Prompt**: Template with variables
- **LLM**: Model to run
- **Output**: Parsed response

### 9.3 Concept: SequentialChain

**SequentialChain = Multiple chains in sequence** (output of one → input of next)

```javascript
import { SequentialChain, LLMChain } from "langchain/chains";

// Chain 1: Extract expenses from text
const extractChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate(
    "Extract expenses as JSON from:\n{text}\n\nJSON:"
  ),
  outputKey: "expenses"  // Output key name
});

// Chain 2: Categorize expenses
const categorizeChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate(
    "Categorize these expenses:\n{expenses}\n\nCategorized:"
  ),
  outputKey: "categorized"
});

// Chain 3: Generate summary
const summaryChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate(
    "Summarize:\n{categorized}\n\nSummary:"
  ),
  outputKey: "summary"
});

// Combine into sequential chain
const overallChain = new SequentialChain({
  chains: [extractChain, categorizeChain, summaryChain],
  inputVariables: ["text"],  // Initial input
  outputVariables: ["summary"],  // Final output
  verbose: true  // Log each step
});

// Run
const result = await overallChain.call({
  text: "I spent 500 on lunch and 300 on taxi today"
});

console.log(result.summary);
// Step 1: Extracts [{"amount": 500, "description": "lunch"}, ...]
// Step 2: Categorizes [{"amount": 500, "category": "Food"}, ...]
// Step 3: Summarizes "₹800 spent today: ₹500 Food, ₹300 Transport"
```

**Flow**:
```
Input: {text: "..."}
         ↓
Chain 1: Extract → {expenses: "[...]"}
         ↓
Chain 2: Categorize → {categorized: "[...]"}
         ↓
Chain 3: Summarize → {summary: "..."}
         ↓
Output: {summary: "..."}
```

### 9.4 Concept: LCEL (LangChain Expression Language)

**LCEL = Modern chain syntax** (pipe operator, more readable)

#### **Old Way (LLMChain)**

```javascript
const chain = new LLMChain({ llm, prompt });
const result = await chain.call({ input: "Hello" });
```

#### **New Way (LCEL)**

```javascript
const chain = prompt.pipe(llm);
const result = await chain.invoke({ input: "Hello" });
```

**Benefits of LCEL**:
- ✅ More concise
- ✅ Better TypeScript support
- ✅ Easier debugging
- ✅ Streaming support built-in
- ✅ Composable with `.pipe()`

#### **LCEL Chain Example**

```javascript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Create components
const prompt = ChatPromptTemplate.fromTemplate(
  "Categorize this expense: {description}"
);
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const parser = new StringOutputParser();

// Chain with pipe
const chain = prompt.pipe(llm).pipe(parser);

// Invoke
const result = await chain.invoke({
  description: "Bought coffee at Starbucks"
});

console.log(result);
// "Food & Beverages"
```

**Equivalent to**:
```
Input → Prompt (format) → LLM (generate) → Parser (extract text) → Output
```

### 9.5 Concept: Chain Input/Output Management

**Chains pass data between steps** - must match keys

#### **Single Input/Output**

```javascript
const chain = prompt.pipe(llm);

// Input variable in prompt must match invoke key
const prompt = PromptTemplate.fromTemplate("Say hello to {name}");

await chain.invoke({ name: "Alice" });  // ✅ Correct
await chain.invoke({ person: "Alice" });  // ❌ Error: missing 'name'
```

#### **Multiple Inputs**

```javascript
const prompt = PromptTemplate.fromTemplate(
  "Add {amount} expense for {category}"
);

const chain = prompt.pipe(llm);

await chain.invoke({
  amount: 500,
  category: "Food"
});
```

#### **Multiple Outputs (SequentialChain)**

```javascript
const chain = new SequentialChain({
  chains: [chain1, chain2, chain3],
  inputVariables: ["text"],
  outputVariables: ["summary", "total", "categories"]
  // Returns object with all 3 outputs
});

const result = await chain.call({ text: "..." });
// { summary: "...", total: 500, categories: ["Food", "Transport"] }
```

### 9.6 Real Example: Expense Categorization Chain

**Not currently in ai-langx/, but useful addition:**

```javascript
// File: src/chains/expenseCategorization.chain.js
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

export const createCategorizationChain = () => {
  // 1. Define output schema
  const outputSchema = z.object({
    category: z.enum([
      "Food",
      "Transport",
      "Shopping",
      "Entertainment",
      "Bills",
      "Healthcare",
      "Education",
      "Other"
    ]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  });
  
  // 2. Create parser
  const parser = StructuredOutputParser.fromZodSchema(outputSchema);
  
  // 3. Create prompt
  const prompt = ChatPromptTemplate.fromTemplate(`
Categorize this expense description into one of the predefined categories.

Categories:
- Food: Meals, groceries, restaurants, cafes
- Transport: Taxi, uber, bus, train, fuel
- Shopping: Clothes, gadgets, household items
- Entertainment: Movies, games, subscriptions
- Bills: Utilities, rent, phone, internet
- Healthcare: Medicine, doctor visits, insurance
- Education: Books, courses, tuition
- Other: Anything else

Expense Description: {description}
Amount: ₹{amount}

{format_instructions}
`);
  
  // 4. Create LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0  // Deterministic
  });
  
  // 5. Build chain
  const chain = prompt.pipe(llm).pipe(parser);
  
  return {
    invoke: async ({ description, amount }) => {
      return await chain.invoke({
        description,
        amount,
        format_instructions: parser.getFormatInstructions()
      });
    }
  };
};

// Usage
const chain = createCategorizationChain();
const result = await chain.invoke({
  description: "Lunch at McDonald's",
  amount: 350
});

console.log(result);
// {
//   category: "Food",
//   confidence: 0.95,
//   reasoning: "Restaurant meal clearly falls under Food category"
// }
```

### 9.7 Concept: Output Parsers

**Output parsers = Extract structured data from LLM responses**

#### **StringOutputParser** (Plain Text)

```javascript
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();
const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke({ input: "Say hi" });
// Returns string: "Hello! How can I help you today?"
```

#### **StructuredOutputParser** (JSON)

```javascript
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    name: z.string(),
    age: z.number(),
    city: z.string()
  })
);

// Parser provides format instructions for LLM
const formatInstructions = parser.getFormatInstructions();
// "Return JSON with fields: name (string), age (number), city (string)..."

const prompt = PromptTemplate.fromTemplate(`
Extract person details from: {text}

{format_instructions}
`);

const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke({
  text: "John is 30 years old and lives in Mumbai",
  format_instructions: formatInstructions
});

console.log(result);
// { name: "John", age: 30, city: "Mumbai" }
```

#### **JsonOutputParser** (Simple JSON)

```javascript
import { JsonOutputParser } from "@langchain/core/output_parsers";

const parser = new JsonOutputParser();
const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke({ input: "..." });
// Returns parsed JSON object
```

### 9.8 Concept: Router Chain (Conditional Branching)

**Router chain = Choose different chains based on input**

```javascript
import { MultiPromptChain } from "langchain/chains";

// Define prompts for different types
const prompts = {
  expense: {
    template: "Process this expense: {input}",
    description: "For expense-related queries"
  },
  question: {
    template: "Answer this question: {input}",
    description: "For general questions about expenses"
  },
  report: {
    template: "Generate report for: {input}",
    description: "For generating reports"
  }
};

// Create router chain
const chain = MultiPromptChain.fromPrompts(llm, prompts);

// Router automatically selects correct prompt chain
const result1 = await chain.call({ input: "Add 500 for lunch" });
// → Routes to 'expense' chain

const result2 = await chain.call({ input: "What's my total this month?" });
// → Routes to 'question' chain

const result3 = await chain.call({ input: "Show me a breakdown" });
// → Routes to 'report' chain
```

**How routing works**:
1. Router analyzes input
2. Selects most relevant prompt/chain
3. Executes selected chain
4. Returns result

### 9.9 Concept: Transformation Chain (Data Processing)

**Transformation chain = Non-LLM processing** (data manipulation)

```javascript
import { TransformChain } from "langchain/chains";

// Chain that normalizes dates
const dateNormalizationChain = new TransformChain({
  inputVariables: ["date"],
  outputVariables: ["normalizedDate"],
  transform: async ({ date }) => {
    // Today, yesterday, or ISO date
    if (date === "today") {
      return { normalizedDate: new Date().toISOString().split('T')[0] };
    }
    if (date === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { normalizedDate: yesterday.toISOString().split('T')[0] };
    }
    return { normalizedDate: date };
  }
});

// Use in sequence
const fullChain = new SequentialChain({
  chains: [
    dateNormalizationChain,  // Transform date
    llmChain  // Then use LLM
  ],
  inputVariables: ["date", "amount"],
  outputVariables: ["result"]
});

await fullChain.call({
  date: "yesterday",
  amount: 500
});
// dateNormalizationChain: "yesterday" → "2026-02-08"
// llmChain: Uses normalized date
```

### 9.10 Error Handling in Chains

**Chains should handle failures gracefully**

```javascript
const chain = prompt.pipe(llm).pipe(parser);

try {
  const result = await chain.invoke({ input: "..." });
  return result;
  
} catch (error) {
  // Parsing error
  if (error.message.includes('parse')) {
    console.error('LLM returned invalid format:', error);
    // Retry with clearer instructions
    return await chain.invoke({
      input: "... (please return valid JSON)",
    });
  }
  
  // API error
  if (error.response?.status === 429) {
    console.error('Rate limit exceeded');
    // Wait and retry
    await sleep(1000);
    return await chain.invoke({ input: "..." });
  }
  
  // Generic error
  throw new Error(`Chain failed: ${error.message}`);
}
```

### 9.11 Chain vs Agent

**When to use Chain**:
- ✅ Fixed workflow (always same steps)
- ✅ Performance critical (no LLM decision overhead)
- ✅ Simple transformations
- ✅ Deterministic output

**When to use Agent**:
- ✅ Dynamic decisions (which tool to use)
- ✅ Multiple possible paths
- ✅ Natural language input
- ✅ Flexibility needed

**Example Comparison**:

```javascript
// ❌ Chain for dynamic decisions (too rigid)
const chain = new SequentialChain({
  chains: [extractChain, categorizeChain, summaryChain]
});
// Always runs all 3 steps, even if not needed

// ✅ Agent for dynamic decisions (flexible)
const agent = new AgentExecutor({ agent, tools });
await agent.invoke({ input: "Add 500 for lunch" });
// Agent: "Only need create_expense, skip other tools"

// ✅ Chain for fixed workflow (efficient)
const reportChain = new SequentialChain({
  chains: [fetchDataChain, aggregateChain, formatChain]
});
// Always need all 3 steps, no decisions needed
```

**✅ You now understand LangChain Chains!**

---

## Chapter 10: Memory - Conversation Context

### 10.1 What Is Memory?

**Memory = Preserving context across conversation turns**

Without memory:
```
User: "My name is Alice"
Bot: "Nice to meet you!"

User: "What's my name?"
Bot: "I don't know your name."  ← Forgot!
```

With memory:
```
User: "My name is Alice"
Bot: "Nice to meet you, Alice!"

User: "What's my name?"
Bot: "Your name is Alice."  ← Remembered!
```

### 10.2 Concept: ConversationBufferMemory (Full History)

**Stores entire conversation** (every message)

```javascript
import { ConversationBufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";

// 1. Create memory
const memory = new ConversationBufferMemory();

// 2. Create chain with memory
const chain = new ConversationChain({
  llm: new ChatOpenAI({ modelName: "gpt-4o-mini" }),
  memory
});

// 3. Conversation
await chain.call({ input: "Hi, I'm Alice" });
// Bot: "Hello Alice! How can I help you?"

await chain.call({ input: "What's my name?" });
// Bot: "Your name is Alice."

// Check memory
console.log(await memory.loadMemoryVariables({}));
// {
//   history: "Human: Hi, I'm Alice\nAI: Hello Alice! How can I help you?\nHuman: What's my name?\nAI: Your name is Alice."
// }
```

**Pros**:
- ✅ Complete context
- ✅ Simple to use

**Cons**:
- ❌ Grows unbounded (long conversations → high costs)
- ❌ Can exceed token limits

**When to use**: Short conversations (< 10 exchanges)

### 10.3 Concept: ConversationBufferWindowMemory (Recent N Messages)

**Stores only last N exchanges** (sliding window)

```javascript
import { ConversationBufferWindowMemory } from "langchain/memory";

// Keep only last 2 exchanges (4 messages)
const memory = new ConversationBufferWindowMemory({ k: 2 });

const chain = new ConversationChain({ llm, memory });

await chain.call({ input: "I'm Alice" });  // Exchange 1
await chain.call({ input: "I live in Mumbai" });  // Exchange 2
await chain.call({ input: "I like pizza" });  // Exchange 3 (drops Exchange 1)

await chain.call({ input: "What's my name?" });
// Bot: "I don't recall your name."  ← Forgotten (outside window)

await chain.call({ input: "Where do I live?" });
// Bot: "You live in Mumbai."  ← Remembered (in window)

await chain.call({ input: "What food do I like?" });
// Bot: "You like pizza."  ← Remembered (in window)
```

**Memory contents** (after 3 exchanges with k=2):
```
Exchange 2: Human: I live in Mumbai / AI: That's great!
Exchange 3: Human: I like pizza / AI: Pizza is delicious!
           ↑ Only these 2 exchanges kept
```

**Pros**:
- ✅ Fixed size (predictable costs)
- ✅ Recent context preserved

**Cons**:
- ❌ Forgets old information

**When to use**: Long conversations where only recent context matters

**Typical k values**:
- k=1: Only last exchange (2 messages)
- k=3-5: Standard (6-10 messages)
- k=10: Extended context

### 10.4 Concept: ConversationSummaryMemory (Compressed History)

**Stores summarized history** (LLM summarizes old messages)

```javascript
import { ConversationSummaryMemory } from "langchain/memory";

const memory = new ConversationSummaryMemory({
  llm: new ChatOpenAI({ modelName: "gpt-4o-mini" })
});

const chain = new ConversationChain({ llm, memory });

await chain.call({ input: "I'm Alice, 30 years old" });
await chain.call({ input: "I live in Mumbai" });
await chain.call({ input: "I work as engineer" });
await chain.call({ input: "I have 2 kids" });

// Memory summarizes:
console.log(await memory.loadMemoryVariables({}));
// {
//   history: "Summary: Alice is a 30-year-old engineer living in Mumbai with 2 kids."
// }

await chain.call({ input: "Tell me about myself" });
// Bot: Uses summary → "You're Alice, a 30-year-old engineer in Mumbai with 2 children."
```

**How it works**:
1. Stores recent messages as-is
2. When threshold reached, summarizes old messages
3. Keeps summary + recent messages

**Pros**:
- ✅ Preserves key information
- ✅ Fixed size

**Cons**:
- ❌ Extra LLM calls (for summaries)
- ❌ May lose details
- ❌ Slower (summarization takes time)

**When to use**: Long conversations needing historical context

### 10.5 Concept: ConversationTokenBufferMemory (Token Limit)

**Stores messages up to token limit** (dynamic size based on tokens)

```javascript
import { ConversationTokenBufferMemory } from "langchain/memory";

// Keep up to 100 tokens of history
const memory = new ConversationTokenBufferMemory({
  llm: new ChatOpenAI({ modelName: "gpt-4o-mini" }),
  maxTokenLimit: 100
});

const chain = new ConversationChain({ llm, memory });

// As conversation grows, old messages dropped when exceeding 100 tokens
```

**Token counting**:
```
Message 1 (15 tokens): "I'm Alice from Mumbai"
Message 2 (12 tokens): "Hi Alice!"
Message 3 (20 tokens): "I work as software engineer"
Message 4 (10 tokens): "That's great!"
Message 5 (25 tokens): "I have been working for 5 years now"
Message 6 (15 tokens): "Impressive experience!"

Total: 97 tokens ✅ All fit

Message 7 (30 tokens): "I want to add an expense of 500 rupees for lunch"
Total: 127 tokens ❌ Exceeds limit
→ Drop Message 1 + Message 2 (27 tokens)
New total: 100 tokens ✅
```

**Pros**:
- ✅ Precise control (based on LLM token limits)
- ✅ Cost-effective

**Cons**:
- ❌ Requires token counting (slightly slower)

**When to use**: Production apps with strict token budgets

### 10.6 Concept: VectorStoreRetrieverMemory (Semantic Search)

**Stores messages in vector database** (retrieves relevant past context)

```javascript
import { VectorStoreRetrieverMemory } from "langchain/memory";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

// 1. Create vector store
const vectorStore = await MemoryVectorStore.fromTexts(
  [],  // Initially empty
  [],
  new OpenAIEmbeddings()
);

// 2. Create memory
const memory = new VectorStoreRetrieverMemory({
  vectorStoreRetriever: vectorStore.asRetriever(3),  // Return top 3 relevant
  memoryKey: "history"
});

// 3. Use in chain
const chain = new ConversationChain({ llm, memory });

// Add messages
await chain.call({ input: "I love pizza" });
await chain.call({ input: "My favorite color is blue" });
await chain.call({ input: "I work at Google" });
await chain.call({ input: "I have a dog named Max" });

// Later...
await chain.call({ input: "What food do I like?" });
// Memory retrieves: "I love pizza" (semantically relevant)
// Bot: "You mentioned you love pizza!"

await chain.call({ input: "Tell me about my pet" });
// Memory retrieves: "I have a dog named Max" (semantically relevant)
// Bot: "You have a dog named Max!"

// Note: "My favorite color" and "I work at Google" NOT retrieved
// (not semantically relevant to current questions)
```

**How it works**:
1. Each message → Embedding → Vector DB
2. On new input, search for semantically similar past messages
3. Include relevant messages in context

**Pros**:
- ✅ Retrieves only relevant context (not everything)
- ✅ Scales to very long conversations
- ✅ Efficient

**Cons**:
- ❌ Complex setup
- ❌ Requires embeddings (extra cost)

**When to use**: Very long conversations or chatbots with persistent history

### 10.7 Memory in Agents vs Chains

#### **Memory in Chains**

```javascript
const memory = new ConversationBufferWindowMemory({ k: 3 });
const chain = new ConversationChain({ llm, memory });

// Chain automatically loads/saves memory
await chain.call({ input: "Hi" });  // Loads history, adds new message, saves
```

#### **Memory in Agents (Manual)**

```javascript
// Agent doesn't have built-in memory
// Must manually manage in application code

const conversationHistory = [];  // Store in DB or session

router.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  // 1. Load history from DB/session
  const history = await loadHistory(req.user.id);
  
  // 2. Add to agent input
  const agent = await createExpenseAgent(token, { userId });
  const result = await agent.invoke({
    input: message,
    chat_history: history  // Pass history explicitly
  });
  
  // 3. Save new exchange to DB/session
  await saveHistory(req.user.id, [
    { role: "user", content: message },
    { role: "assistant", content: result.output }
  ]);
  
  res.json({ reply: result.output });
});
```

**Key difference**:
- **Chains**: Memory built-in (automatic load/save)
- **Agents**: Manual memory management (more control)

### 10.8 Custom Memory Implementation for ai-langx/

**Current ai-langx/ approach** (simplified):

```javascript
// File: src/routes/chat.js
router.post('/chat', authMiddleware, async (req, res) => {
  const { message, history = [] } = req.body;
  
  // Client sends history in request
  // [
  //   {role: "user", content: "Add 500 for lunch"},
  //   {role: "assistant", content: "Added ₹500..."},
  //   {role: "user", content: "Show my expenses"}
  // ]
  
  const agent = await createExpenseAgent(req.token, {
    userId: req.user.userId
  });
  
  const result = await agent.invoke({
    input: message,
    chat_history: formatHistory(history)  // Format for LLM
  });
  
  res.json({
    reply: result.output,
    // Client appends to history for next request
  });
});

// Format history function
function formatHistory(history) {
  return history
    .map(msg => `${msg.role === 'user' ? 'Human' : 'AI'}: ${msg.content}`)
    .join('\n');
}
```

**Alternative: Server-side session memory**

```javascript
// File: src/utils/memoryManager.js
import { ConversationBufferWindowMemory } from "langchain/memory";

const sessionMemories = new Map();  // sessionId → Memory

export const getMemory = (sessionId) => {
  if (!sessionMemories.has(sessionId)) {
    sessionMemories.set(
      sessionId,
      new ConversationBufferWindowMemory({ k: 5 })  // Last 5 exchanges
    );
  }
  return sessionMemories.get(sessionId);
};

export const clearMemory = (sessionId) => {
  sessionMemories.delete(sessionId);
};

// Usage in route
router.post('/chat', authMiddleware, async (req, res) => {
  const memory = getMemory(req.sessionID);
  
  const chain = new ConversationChain({
    llm: new ChatOpenAI({ modelName: "gpt-4o-mini" }),
    memory
  });
  
  const result = await chain.call({ input: req.body.message });
  
  res.json({ reply: result.text });
});

// Clear memory endpoint
router.post('/chat/clear', authMiddleware, (req, res) => {
  clearMemory(req.sessionID);
  res.json({ success: true });
});
```

### 10.9 Memory Best Practices

#### **1. Choose Right Memory Type**

```javascript
// Short conversations (< 10 exchanges)
const memory = new ConversationBufferMemory();

// Long conversations
const memory = new ConversationBufferWindowMemory({ k: 5 });

// Cost-sensitive
const memory = new ConversationTokenBufferMemory({ maxTokenLimit: 500 });

// Very long conversations
const memory = new VectorStoreRetrieverMemory({ vectorStoreRetriever });
```

#### **2. Set Appropriate Limits**

```javascript
// Too small: Forgets context too quickly
const memory = new ConversationBufferWindowMemory({ k: 1 });  // Only 1 exchange
// User: "I'm Alice"
// User: "What's my name?"
// Bot: "I don't know" ← Already forgot

// Too large: High costs, exceeds tokens
const memory = new ConversationBufferWindowMemory({ k: 100 });  // 200 messages
// Most LLMs can't handle this in context window

// Just right: Balance context and cost
const memory = new ConversationBufferWindowMemory({ k: 5 });  // Last 5 exchanges
```

#### **3. Clear Memory When Appropriate**

```javascript
// After task completion
await agent.invoke({ input: "Add 500 for lunch" });
await agent.invoke({ input: "Thanks!" });
// Clear memory here (conversation done)
await memory.clear();

// After user logout
router.post('/logout', (req, res) => {
  clearMemory(req.sessionID);
  res.json({ success: true });
});

// Periodic cleanup (long-running sessions)
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [sessionId, { lastActive }] of sessions) {
    if (lastActive < oneHourAgo) {
      clearMemory(sessionId);
      sessions.delete(sessionId);
    }
  }
}, 600000);  // Every 10 minutes
```

#### **4. Include System Context**

```javascript
const memory = new ConversationBufferWindowMemory({
  k: 5,
  returnMessages: true  // Return as message objects, not string
});

// Add system context
await memory.saveContext(
  { input: "System: User is Alice, userId=123" },
  { output: "Acknowledged" }
);

// Now LLM has context even after memory window slides
```

### 10.10 Memory Storage Backends

**In-memory** (default):
```javascript
const memory = new ConversationBufferMemory();
// ❌ Lost on server restart
// ❌ Not shared across instances
```

**Redis** (persistent):
```javascript
import { RedisChatMessageHistory } from "@langchain/community/stores/message/ioredis";
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory({
  chatHistory: new RedisChatMessageHistory({
    sessionId: "user-123",
    client: redisClient
  })
});
// ✅ Persists across restarts
// ✅ Shared across server instances
```

**Database** (custom):
```javascript
import { BaseChatMessageHistory } from "@langchain/core/chat_history";

class PostgresChatHistory extends BaseChatMessageHistory {
  constructor(userId) {
    super();
    this.userId = userId;
  }
  
  async addMessage(message) {
    await db.query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [this.userId, message._getType(), message.content]
    );
  }
  
  async getMessages() {
    const result = await db.query(
      'SELECT * FROM chat_history WHERE user_id = $1 ORDER BY created_at',
      [this.userId]
    );
    return result.rows.map(row => 
      row.role === 'human' 
        ? new HumanMessage(row.content)
        : new AIMessage(row.content)
    );
  }
  
  async clear() {
    await db.query('DELETE FROM chat_history WHERE user_id = $1', [this.userId]);
  }
}

// Usage
const memory = new BufferMemory({
  chatHistory: new PostgresChatHistory(userId)
});
```

**✅ You now understand LangChain Memory!**

---

## Part 2 Summary

**Concepts Covered**: 60+

### Tools (20+ concepts)
- ✅ What tools are and why they're needed
- ✅ StructuredTool class structure
- ✅ Zod schema validation
- ✅ Tool context injection
- ✅ Multiple tools in agent
- ✅ Tool error handling
- ✅ DynamicTool
- ✅ Tool design best practices

### Agents (25+ concepts)
- ✅ What agents are (autonomous LLM)
- ✅ ReAct pattern (Reason → Act → Observe)
- ✅ AgentExecutor
- ✅ Agent types (OpenAI Tools, ReAct, etc.)
- ✅ Agent configuration (maxIterations, timeout, etc.)
- ✅ Agent prompts and system instructions
- ✅ Agent scratchpad
- ✅ Parallel tool calling
- ✅ Early stopping
- ✅ Common agent patterns

### Chains (10+ concepts)
- ✅ What chains are
- ✅ LLMChain
- ✅ SequentialChain
- ✅ LCEL (pipe operator)
- ✅ Chain input/output management
- ✅ Output parsers (String, Structured, JSON)
- ✅ Router chains
- ✅ Transformation chains
- ✅ Error handling in chains
- ✅ Chain vs Agent

### Memory (10+ concepts)
- ✅ What memory is
- ✅ ConversationBufferMemory
- ✅ ConversationBufferWindowMemory
- ✅ ConversationSummaryMemory
- ✅ ConversationTokenBufferMemory
- ✅ VectorStoreRetrieverMemory
- ✅ Memory in agents vs chains
- ✅ Custom memory implementation
- ✅ Memory best practices
- ✅ Memory storage backends (Redis, DB)

---

## Hands-On Exercise: Build Complete Expense Agent

**Goal**: Create expense agent with tools, memory, and error handling

**Step 1**: Create Tools
```javascript
// Create CreateExpenseTool, ListExpensesTool, DeleteExpenseTool
// (Use examples from Chapter 7)
```

**Step 2**: Add Memory
```javascript
const memory = new ConversationBufferWindowMemory({ k: 3 });
```

**Step 3**: Create Agent
```javascript
const agent = await createOpenAIToolsAgent({ llm, tools, prompt });
const executor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 5,
  returnIntermediateSteps: true
});
```

**Step 4**: Add Memory Management
```javascript
// Before each request
const history = await memory.loadMemoryVariables({});

// After each request
await memory.saveContext(
  { input: userMessage },
  { output: agentResponse }
);
```

**Step 5**: Test
```javascript
await executor.invoke({ input: "Add 500 for lunch", chat_history: history });
await executor.invoke({ input: "What did I just add?", chat_history: history });
// Should remember: "You added ₹500 for lunch"
```

**Challenge**: Add ConversationSummaryMemory for long conversations!

---

**Continue to Part 3**: [PART_3_LANGCHAIN_RAG.md](PART_3_LANGCHAIN_RAG.md) (Document Loaders, Text Splitters, Embeddings, Vector Stores, Retrievers, RAG Chains - 50+ concepts)

**Or jump to**: [PART_5_LANGGRAPH.md](PART_5_LANGGRAPH.md) (StateGraph Workflows - 40+ concepts)
