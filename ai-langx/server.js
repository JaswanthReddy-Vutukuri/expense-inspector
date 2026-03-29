/**
 * AI-LANGX SERVER - LangChain/LangGraph/LangSmith Implementation
 * 
 * PURPOSE:
 * - Express server for LangChain-based AI orchestrator
 * - Demonstrates production setup with LangSmith tracing
 * - Parallel implementation to ai/server.js for comparison
 * 
 * KEY DIFFERENCES FROM ai/server.js:
 * ✅ Runs on different port (3002 vs 3001)
 * ✅ Uses LangSmith middleware
 * ✅ LangChain-based request handling
 * ✅ Same security and safety patterns
 * 
 * COMPARE WITH: ai/server.js
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './src/config/env.js';
import { initializeLangSmith } from './src/config/langsmith.config.js';
import chatRoutes from './src/routes/chat.js';
import uploadRoutes from './src/routes/upload.js';
import reconcileRoutes from './src/routes/reconcile.js';
import { authMiddleware } from './src/middleware/auth.js';
import debugRoutes from './src/routes/debug.js';

const app = express();
const PORT = config.port;
const IS_PRODUCTION = config.isProduction;
const ENABLE_DEBUG = process.env.ENABLE_DEBUG_ROUTES === 'true';

// Initialize LangSmith tracing
initializeLangSmith();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = config.allowedOrigins.length > 0
  ? config.allowedOrigins
  : (IS_PRODUCTION ? [] : ['http://localhost:4200']);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/ai', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/ai', chatRoutes);
app.use('/ai/upload', authMiddleware, uploadRoutes);
app.use('/ai/reconcile', reconcileRoutes);
// Debug routes - disabled in production unless explicitly enabled
if (!IS_PRODUCTION || ENABLE_DEBUG) {
  app.use('/ai', debugRoutes);
  console.log('[Server] Debug routes ENABLED');
} else {
  console.log('[Server] Debug routes DISABLED (production mode)');
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'AI Orchestrator (LangChain)',
    framework: 'LangChain + LangGraph',
    langsmith: process.env.LANGCHAIN_TRACING_V2 === 'true' ? 'enabled' : 'disabled'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  
  const status = err.status || 500;
  const message = IS_PRODUCTION ? 'Internal server error' : err.message;
  
  res.status(status).json({ 
    error: message,
    ...(IS_PRODUCTION ? {} : { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🚀 AI-LANGX ORCHESTRATOR (LangChain Implementation)  ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  📍 Server:    port ${PORT}`);
  console.log(`  🔗 Backend:   ${config.backendBaseUrl}`);
  console.log(`  🧠 LLM:       ${config.llmModel}`);
  console.log(`  📊 LangSmith: ${config.langchainTracingV2 === 'true' ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`  🏠 Project:   ${config.langchainProject}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('  📚 Compare with custom implementation at port 3001');
  console.log('  📖 See ARCHITECTURE_ANALYSIS.md for detailed comparison');
  console.log('');
});

/**
 * PRODUCTION DEPLOYMENT NOTES:
 * 
 * 1. ENVIRONMENT VARIABLES:
 *    Required:
 *    - OPENAI_API_KEY
 *    - LANGCHAIN_API_KEY (for tracing)
 *    - BACKEND_BASE_URL
 *    
 *    Optional:
 *    - PORT (default: 3002)
 *    - LLM_MODEL (default: gpt-4o-mini)
 *    - LANGCHAIN_PROJECT (default: expense-tracker-ai-langx)
 *    - ALLOWED_ORIGINS (default: http://localhost:4200)
 * 
 * 2. SECURITY:
 *    ✅ Helmet for security headers
 *    ✅ CORS with whitelist
 *    ✅ Rate limiting (100 req/15min)
 *    ✅ Body size limit (1MB)
 *    ✅ JWT auth on routes (see chat.js)
 * 
 * 3. MONITORING:
 *    ✅ LangSmith traces (if LANGCHAIN_TRACING_V2=true)
 *    ✅ Request logging
 *    ✅ Error logging
 *    ✅ Health check endpoint
 * 
 * 4. COST CONTROL:
 *    ✅ Rate limiting per IP
 *    ✅ Max agent iterations (5)
 *    ✅ Request timeout (60s)
 *    ✅ Max response tokens (500)
 *    ✅ LangSmith cost tracking
 * 
 * 5. COMPARISON WITH CUSTOM (ai/server.js):
 *    Same:
 *    - Express server
 *    - Security middleware
 *    - Rate limiting
 *    - CORS configuration
 *    - Error handling
 *    
 *    Different:
 *    - Port (3002 vs 3001)
 *    - LangSmith initialization
 *    - Routes use LangChain agents
 *    - Health check shows framework info
 */
