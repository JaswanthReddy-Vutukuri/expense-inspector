/**
 * Centralized environment configuration.
 * Validates required variables at startup — fails fast if anything is missing.
 * All other files import from here instead of reading process.env directly.
 */
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[Config] FATAL: Missing required environment variable: ${name}`);
    console.error(`[Config] Check your .env file (see .env.example for reference)`);
    process.exit(1);
  }
  return value;
}

function optional(name, fallback) {
  return process.env[name] || fallback;
}

export const config = {
  port: optional('PORT', '3002'),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',

  // OpenAI
  openaiApiKey: required('OPENAI_API_KEY'),
  llmModel: optional('LLM_MODEL', 'gpt-4o-mini'),
  embeddingModel: optional('EMBEDDING_MODEL', 'text-embedding-ada-002'),

  // LangSmith
  langchainTracingV2: optional('LANGCHAIN_TRACING_V2', 'false'),
  langchainApiKey: optional('LANGCHAIN_API_KEY', ''),
  langchainProject: optional('LANGCHAIN_PROJECT', 'expense-tracker-ai-langx'),

  // Backend
  backendBaseUrl: required('BACKEND_BASE_URL'),

  // Auth
  jwtSecret: optional('JWT_SECRET', ''),

  // CORS
  allowedOrigins: optional('ALLOWED_ORIGINS', '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
};
