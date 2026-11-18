import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { getActiveAiProvider } from './src/services/aiProvider';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const provider = getActiveAiProvider();
    res.json({
      status: 'ok',
      service: 'D.A.R.V.I.S. Core Gateway',
      aiConfigured: provider.isConfigured(),
      provider: provider.name,
      model: provider.model,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/ai/chat', async (req, res) => {
    const {
      message,
      history = [],
      systemContext = '',
      persona = 'estrategico',
      thinkingLevel = 'LOW',
      requireHumanApproval = true,
    } = req.body ?? {};

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
      return;
    }

    const provider = getActiveAiProvider();

    try {
      const result = await provider.generateReply({
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        systemContext: typeof systemContext === 'string' ? systemContext : '',
        persona,
        thinkingLevel,
        requireHumanApproval: Boolean(requireHumanApproval),
      });
      res.json(result);
    } catch (error) {
      const err = error as Error & { status?: number };
      const status = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
      res.status(status).json({
        error: err.message || 'Falha ao consultar o provedor de IA.',
        provider: provider.name,
        model: provider.model,
      });
    }
  });

  app.post('/api/ai/daily-focus', async (req, res) => {
    const {
      userName = 'David',
      pendingTasksCount = 0,
      activeProjectsCount = 0,
      dateKey = new Date().toISOString().slice(0, 10),
    } = req.body ?? {};

    const provider = getActiveAiProvider();

    try {
      const result = await provider.generateDailyFocus({
        userName: typeof userName === 'string' && userName.trim() ? userName : 'David',
        pendingTasksCount: Number.isFinite(Number(pendingTasksCount))
          ? Number(pendingTasksCount)
          : 0,
        activeProjectsCount: Number.isFinite(Number(activeProjectsCount))
          ? Number(activeProjectsCount)
          : 0,
        dateKey:
          typeof dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
            ? dateKey
            : new Date().toISOString().slice(0, 10),
      });
      res.json(result);
    } catch (error) {
      const err = error as Error & { status?: number };
      const status = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
      res.status(status).json({
        error: err.message || 'Falha ao gerar foco diário.',
        provider: provider.name,
        model: provider.model,
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`D.A.R.V.I.S. server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
