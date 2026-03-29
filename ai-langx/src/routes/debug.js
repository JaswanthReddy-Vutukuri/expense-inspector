/**
 * DEBUG & OBSERVABILITY ROUTES — LangChain Implementation
 *
 * Provides inspection endpoints for RAG system internals.
 * Uses ai-langx's LangChain MemoryVectorStore infrastructure.
 * Response formats match ai/ debug routes so the frontend works unchanged.
 *
 * Endpoints:
 * - GET /ai/debug/stats       — Vector store statistics
 * - GET /ai/debug/chunks      — List document chunks (no embeddings)
 * - GET /ai/debug/documents   — List uploaded documents
 * - GET /ai/debug/search      — Test similarity search
 * - GET /ai/debug/embedding-info — Embedding dimension validation
 * - GET /ai/debug/health      — Health check (no auth)
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getVectorStore, getStats, similaritySearch } from '../rag/vectorstore/memory.store.js';
import { generateEmbedding, createEmbeddings } from '../rag/embeddings/openai.embeddings.js';

const router = express.Router();

/**
 * GET /ai/debug/stats
 */
router.get('/debug/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const store = await getVectorStore();
    const vectors = store.memoryVectors || [];
    const userVectors = vectors.filter(v => (v.metadata?.userId ?? v.content?.metadata?.userId) === userId);

    // Detect embedding dimension from stored vectors
    let embeddingDimension = 0;
    const firstWithEmbedding = vectors.find(v => v.embedding?.length > 0);
    if (firstWithEmbedding) embeddingDimension = firstWithEmbedding.embedding.length;

    // Count unique documents for this user
    const docFilenames = new Set();
    userVectors.forEach(v => {
      const filename = v.metadata?.filename || v.content?.metadata?.filename;
      if (filename) docFilenames.add(filename);
    });

    res.json({
      success: true,
      stats: {
        totalDocuments: docFilenames.size,
        totalChunks: userVectors.length,
        totalExpenses: 0, // Not tracked in vector store
        embeddingDimension,
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime()
        },
        currentUserId: userId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/debug/chunks
 */
router.get('/debug/chunks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { limit = 50, documentId } = req.query;
    const store = await getVectorStore();
    const vectors = store.memoryVectors || [];

    let userVectors = vectors.filter(v => {
      const uid = v.metadata?.userId ?? v.content?.metadata?.userId;
      return uid === userId;
    });

    if (documentId) {
      userVectors = userVectors.filter(v => {
        const did = v.metadata?.documentId ?? v.content?.metadata?.documentId;
        return did === documentId;
      });
    }

    const limited = userVectors.slice(0, parseInt(limit));

    const chunks = limited.map((v, i) => ({
      id: v.metadata?.id || v.content?.metadata?.id || `chunk_${i}`,
      documentId: v.metadata?.documentId || v.content?.metadata?.documentId || '',
      text: v.content?.pageContent || (typeof v.content === 'string' ? v.content : ''),
      chunkIndex: v.metadata?.chunkIndex ?? v.content?.metadata?.chunkIndex ?? i,
      embeddingSize: v.embedding?.length || 0,
      hasEmbedding: Array.isArray(v.embedding) && v.embedding.length > 0,
    }));

    res.json({
      success: true,
      total: userVectors.length,
      returned: chunks.length,
      chunks,
      userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/debug/documents
 */
router.get('/debug/documents', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const store = await getVectorStore();
    const vectors = store.memoryVectors || [];

    // Group vectors by filename for this user
    const docMap = new Map();
    vectors.forEach(v => {
      const uid = v.metadata?.userId ?? v.content?.metadata?.userId;
      if (uid !== userId) return;

      const filename = v.metadata?.filename || v.content?.metadata?.filename;
      if (!filename) return;

      if (!docMap.has(filename)) {
        docMap.set(filename, {
          id: v.metadata?.documentId || v.content?.metadata?.documentId || filename,
          filename,
          uploadedAt: v.metadata?.uploadedAt || v.content?.metadata?.uploadedAt || '',
          userId,
          numChunks: 0,
          totalLength: 0,
        });
      }

      const doc = docMap.get(filename);
      doc.numChunks++;
      const text = v.content?.pageContent || '';
      doc.totalLength += text.length;
    });

    res.json({
      success: true,
      count: docMap.size,
      documents: Array.from(docMap.values()),
      userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/debug/search
 */
router.get('/debug/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { q: query, topK = 5 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const startTime = Date.now();
    const results = await similaritySearch(query, parseInt(topK), { userId });
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      query,
      topK: parseInt(topK),
      resultsCount: results.length,
      durationMs: duration,
      userId,
      results: results.map(doc => ({
        text: (doc.pageContent || '').substring(0, 200) + ((doc.pageContent || '').length > 200 ? '...' : ''),
        similarity: doc.metadata?.similarityScore,
        filename: doc.metadata?.filename,
        chunkIndex: doc.metadata?.chunkIndex,
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/debug/embedding-info
 */
router.get('/debug/embedding-info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const store = await getVectorStore();
    const vectors = (store.memoryVectors || []).filter(v => {
      const uid = v.metadata?.userId ?? v.content?.metadata?.userId;
      return uid === userId;
    });

    if (vectors.length === 0) {
      return res.json({
        success: true,
        message: 'No documents uploaded yet',
        currentModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
        expectedDimension: 1536
      });
    }

    const dimensions = vectors.map(v => v.embedding?.length).filter(Boolean);
    const uniqueDimensions = [...new Set(dimensions)];
    const storedDimension = uniqueDimensions[0] || 0;
    const expectedDimension = 1536; // text-embedding-ada-002

    const mismatch = storedDimension !== expectedDimension && storedDimension > 0;

    res.json({
      success: true,
      currentModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
      expectedDimension,
      storedDimensions: {
        unique: uniqueDimensions,
        totalChunks: dimensions.length
      },
      dimensionMismatch: mismatch,
      recommendation: mismatch
        ? `Mismatch: stored ${storedDimension}d vs expected ${expectedDimension}d. Re-upload documents to fix.`
        : 'Embeddings are compatible with current model'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ai/debug/health
 */
router.get('/debug/health', async (req, res) => {
  try {
    const storeStats = await getStats();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      framework: 'LangChain + LangGraph',
      services: {
        vectorStore: {
          status: 'operational',
          documentsCount: storeStats.totalDocuments,
          uniqueUsers: storeStats.uniqueUsers,
        },
        embeddings: {
          status: 'operational',
          model: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
        },
        llm: {
          status: 'operational',
          model: process.env.LLM_MODEL || 'gpt-4o-mini',
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
        uptime: Math.round(process.uptime()) + ' seconds',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, status: 'unhealthy', error: error.message });
  }
});

export default router;
