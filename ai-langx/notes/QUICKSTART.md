# QUICKSTART GUIDE - AI-LANGX

Get the LangChain-based AI orchestrator running in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Backend server running (see `backend/.env` for port)
- OpenAI API key
- LangSmith API key (optional, for tracing)

---

## Step 1: Install Dependencies

```bash
cd ai-langx
npm install
```

This installs:
- `@langchain/core` - Core LangChain functionality
- `@langchain/openai` - OpenAI integration
- `langsmith` - Observability platform
- `express` - Web server
- `zod` - Schema validation
- Other utilities

**Installation time**: ~2 minutes

---

## Step 2: Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required variables**:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
BACKEND_BASE_URL=http://your-backend-host:port
JWT_SECRET=must-match-backend-jwt-secret
```

**Optional (for LangSmith tracing)**:
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key-here
LANGCHAIN_PROJECT=expense-tracker-ai-langx
```

Get LangSmith API key: https://smith.langchain.com/

> **Note**: The server will fail to start if required variables (`OPENAI_API_KEY`, `BACKEND_BASE_URL`) are missing. See `src/config/env.js` for the full list.

---

## Step 3: Start Server

```bash
npm start
```

You should see:
```
═══════════════════════════════════════════════════════════
  🚀 AI-LANGX ORCHESTRATOR (LangChain Implementation)
═══════════════════════════════════════════════════════════
  📍 Server:    port <PORT>
  🔗 Backend:   <BACKEND_BASE_URL>
  🧠 LLM:       gpt-4o-mini
  📊 LangSmith: ✅ ENABLED
  🏠 Project:   expense-tracker-ai-langx
═══════════════════════════════════════════════════════════
```

---

## Step 4: Get JWT Token

You need a JWT token to authenticate. Get it from the backend:

```bash
# Set your service URLs (adjust ports to match your .env)
export BACKEND=http://localhost:3003
export AI=http://localhost:3002

# Login to backend
curl -X POST $BACKEND/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

**Save the token**:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Step 5: Test Chat Endpoint

```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add 500 for lunch today"
  }'
```

**Expected response**:
```json
{
  "reply": "✅ Successfully added ₹500 for Food on 2026-02-08"
}
```

---

## Step 6: View LangSmith Trace (Optional)

If you enabled LangSmith:

1. Go to https://smith.langchain.com/
2. Navigate to your project: `expense-tracker-ai-langx`
3. Find the latest trace
4. Click to view detailed execution:
   - LLM calls with prompts and responses
   - Tool calls with arguments and results
   - Token usage and cost
   - Execution time per step

---

## Common Commands

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Run tests (when implemented)
npm test

# Health check
curl $AI/health
```

---

## Compare with Custom Implementation

Both implementations can run simultaneously on different ports:

```bash
# Custom implementation (ai/ service)
curl -X POST http://<ai-vanilla-host>:<port>/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my expenses"}'

# Framework implementation (ai-langx/ service)
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my expenses"}'
```

**They should return similar results!**

---

## Example Interactions

### Add Expense
```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add 1500 for groceries yesterday"}'
```

### List Expenses
```bash
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show all my expenses"}'
```

### Update Expense
```bash
# First, list to get ID
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "List my expenses"}'

# Then update
curl -X POST $AI/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Update expense 123 amount to 600"}'
```

---

## Troubleshooting

### Server won't start

**Error**: `FATAL: Missing required environment variable: OPENAI_API_KEY`
**Solution**: Check your `.env` file has all required variables (see `.env.example`)

**Error**: `Cannot find module '@langchain/core'`
**Solution**: Run `npm install`

**Error**: `Port already in use`
**Solution**: Change `PORT` in `.env`

### Authentication errors

**Error**: `Authorization header missing`
**Solution**: Include `-H "Authorization: Bearer $TOKEN"` in curl

**Error**: `Invalid token`
**Solution**: Get new token from backend (tokens expire). Ensure `JWT_SECRET` matches between backend and AI service.

### LangSmith not showing traces

1. `LANGCHAIN_TRACING_V2=true` in `.env`
2. `LANGCHAIN_API_KEY` is set correctly
3. Wait 10-30 seconds for traces to appear
4. Check correct project name

### Backend connection failed

**Error**: `Cannot connect to backend`
**Solution**: Ensure backend is running and `BACKEND_BASE_URL` in `.env` points to it.

---

## Next Steps

1. **Read Documentation**: See [README.md](../README.md)
2. **Compare Implementations**: See [docs/COMPARISON.md](../docs/COMPARISON.md)
3. **Understand Architecture**: See [ARCHITECTURE_ANALYSIS.md](../ARCHITECTURE_ANALYSIS.md)
4. **Explore Code**: Start with `src/tools/createExpense.tool.js`

---

## Quick Reference

| **Endpoint** | **Path** |
|--------------|----------|
| Framework Chat | `POST /ai/chat` |
| Custom Chat | `POST /ai/chat` (vanilla service) |
| Health Check | `GET /health` |
| Endpoint Info | `GET /ai/chat/info` |
| Backend API | `/api` (backend service) |
| LangSmith | https://smith.langchain.com/ |

---
