import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './src/config/env.js';
import chatRoutes from './src/routes/chat.js';
import uploadRoutes from './src/routes/upload.js';
import debugRoutes from './src/routes/debug.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();
const PORT = config.port;
const IS_PRODUCTION = config.isProduction;
const ENABLE_DEBUG = process.env.ENABLE_DEBUG_ROUTES === 'true';

// Add helmet for security headers
app.use(helmet());

// Restrict origins to environment-configured values only
const allowedOrigins = config.allowedOrigins.length > 0
  ? config.allowedOrigins
  : (IS_PRODUCTION ? [] : ['http://localhost:4200']);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
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

// Limit requests per IP to prevent abuse and cost explosion
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all AI routes
app.use('/ai', limiter);

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/ai', chatRoutes);
app.use('/ai', uploadRoutes);

// Debug routes - disabled in production unless explicitly enabled
if (!IS_PRODUCTION || ENABLE_DEBUG) {
  app.use('/ai', debugRoutes);
  console.log('[Server] ✅ Debug routes ENABLED');
} else {
  console.log('[Server] 🔒 Debug routes DISABLED (production mode)');
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'AI Orchestrator' });
});

// Centralized Error Handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Orchestrator running on port ${PORT}`);
  console.log(`🔗 Backend URL: ${config.backendBaseUrl}`);
});
