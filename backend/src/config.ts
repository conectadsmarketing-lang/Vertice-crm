import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'vertice-crm',
  },
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  dataDir: process.env.DATA_DIR || './data',
} as const;
