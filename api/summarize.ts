import type { IncomingMessage, ServerResponse } from 'http';
import { processJournalSummary } from '../server/geminiService';

interface CustomRequest extends IncomingMessage {
  query?: Record<string, any>;
  body?: any;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

async function parseBody(req: CustomRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let bodyStr = '';
    req.on('data', (chunk) => {
      bodyStr += chunk;
    });
    req.on('end', () => {
      try {
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(req: CustomRequest, res: CustomResponse) {
  if (typeof res.status !== 'function') {
    (res as any).status = function (statusCode: number) {
      this.statusCode = statusCode;
      return this;
    };
  }
  if (typeof res.json !== 'function') {
    (res as any).json = function (data: any) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
    };
  }

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    const body = await parseBody(req);
    const { messages, title } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required for summarization.' });
    }

    const result = await processJournalSummary({
      messages,
      title,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/summarize serverless function:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize journal entry summary.',
    });
  }
}
