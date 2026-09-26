import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app, connectDB } from './server-app.ts';

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initiate database connection
  connectDB().catch((err: any) => {
    console.error('[Server] Initial MongoDB connection error:', err?.message || err);
  });

  // Vite Middleware & SPA Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [FarmFlow Pro] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
