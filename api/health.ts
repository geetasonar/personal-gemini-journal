import type { IncomingMessage, ServerResponse } from 'http';

interface CustomRequest extends IncomingMessage {
  query?: Record<string, any>;
  body?: any;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default function handler(req: CustomRequest, res: CustomResponse) {
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

  return res.status(200).json({
    status: 'ok',
    service: 'Personal Gemini Journal (Vercel Serverless)',
    timestamp: Date.now(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}
