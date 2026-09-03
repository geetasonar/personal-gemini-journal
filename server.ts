import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { processChatReflection, processJournalSummary } from './server/geminiService';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ReflectAI Server',
      timestamp: Date.now(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // POST /api/chat - Multi-turn conversational journaling & reflection
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { messages, mode, reflectionTitle, currentMood } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
      }

      const result = await processChatReflection({
        messages,
        mode,
        reflectionTitle,
        currentMood,
      });

      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate reflection response.',
      });
    }
  });

  // POST /api/summarize - Summarize journal entry into structured insights
  app.post('/api/summarize', async (req: Request, res: Response) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { messages, title } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required for summarization.' });
      }

      const result = await processJournalSummary({
        messages,
        title,
      });

      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/summarize:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to synthesize journal entry summary.',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});
