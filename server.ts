import path from 'path';
import fs from 'fs';
import express from 'express';
import { app, connectDB } from './server-app.ts';

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initiate database connection asynchronously so HTTP listener binds immediately for Render port scan
  connectDB().catch((err: any) => {
    console.error('[Server] Initial MongoDB connection error:', err?.message || err);
  });

  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_EXTERNAL_URL);

  // Vite Middleware in Development & Static SPA Serving in Production (Render / Cloud Run)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        index: false,
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      if (fs.existsSync(distIndexHtml)) {
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        );
        res.sendFile(distIndexHtml);
      } else {
        res
          .status(503)
          .send('Production build artifacts not found. Ensure "npm run build" ran during deploy.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `🚀 [FarmFlow Pro] Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`
    );
  });

  // Render recommended keep-alive timeouts to prevent 502 Bad Gateway behind Envoy/Cloudflare proxy
  server.keepAliveTimeout = 120 * 1000;
  server.headersTimeout = 125 * 1000;
}

startServer();
