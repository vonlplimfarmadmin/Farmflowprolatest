import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  checkConnection,
  pullAllCollections,
  syncAllCollections,
  upsertDocument,
  getDocument,
  deleteDocument,
  isAllowedCollection,
  sanitizeDocId,
  purgeOldRecords,
} from './server/mongodb.ts';

dotenv.config();

// In-memory sliding rate-limit tracker
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 3 * 60 * 1000);

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const key = `${rawIp}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again shortly.',
      });
    }

    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Prevent server technology fingerprinting
  app.disable('x-powered-by');

  // Hardened Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });

  // Strict Request Body Limit to prevent memory exhaustion / DoS
  app.use(express.json({ limit: '10mb' }));

  // Global Cache-Control middleware for dynamic API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
  });

  // Apply generous rate limit to prevent DDoS while never throttling active farm logging
  app.use('/api', createRateLimiter(5000, 60 * 1000));

  // Health check endpoint
  app.get('/api/health', async (_req, res) => {
    try {
      const status = await checkConnection();
      res.json({
        status: status.connected ? 'ok' : 'degraded',
        service: 'FarmFlow Pro OS',
        timestamp: new Date().toISOString(),
        mongodb: status,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        error: 'Health check failed',
      });
    }
  });

  // MongoDB Status & Diagnostics
  app.get('/api/mongodb/status', async (_req, res) => {
    try {
      const status = await checkConnection();
      res.json(status);
    } catch {
      res.status(500).json({
        connected: false,
        error: 'Unable to retrieve database status',
      });
    }
  });

  // Pull All Collections
  app.get('/api/mongodb/pull', async (_req, res) => {
    try {
      const data = await pullAllCollections();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[API /api/mongodb/pull] error:', err?.message || err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve farm dataset',
      });
    }
  });

  // Sync / Push All Collections
  app.post('/api/mongodb/sync', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ success: false, error: 'Malformed synchronization payload' });
      }
      const result = await syncAllCollections(payload);
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/mongodb/sync] error:', err?.message || err);
      res.status(500).json({
        success: false,
        error: 'Database synchronization failed',
      });
    }
  });

  // Purge / Delete Persistent Old Records from Database
  app.post('/api/mongodb/purge', async (req, res) => {
    try {
      const { collections, preserveUsers = true, preserveStandards = true, preserveFarmProfile = true } = req.body || {};
      const result = await purgeOldRecords({
        collectionsToClear: collections,
        preserveUsers,
        preserveStandards,
        preserveFarmProfile,
      });
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/mongodb/purge] error:', err?.message || err);
      res.status(500).json({ success: false, error: 'Failed to purge database records' });
    }
  });

  // Farm Profile Endpoints
  app.get('/api/mongodb/farm-profile', async (_req, res) => {
    try {
      const data = await pullAllCollections();
      res.json({
        success: true,
        data: data.farmProfile || null,
        standards: data.standards || null,
        settings: data.settings || null,
      });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to retrieve farm profile' });
    }
  });

  app.post('/api/mongodb/farm-profile', async (req, res) => {
    try {
      const profile = req.body;
      if (!profile || typeof profile !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid profile data' });
      }
      const result = await syncAllCollections({ farmProfile: profile });
      res.json({
        success: true,
        message: 'Farm profile saved directly to MongoDB.',
        result,
      });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to save farm profile' });
    }
  });

  // Single Document CRUD with Whitelist & ID Validation
  app.get('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!isAllowedCollection(collection)) {
        return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
      }
      const cleanId = sanitizeDocId(id);
      const doc = await getDocument(collection, cleanId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      res.json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error fetching document' });
    }
  });

  app.post('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!isAllowedCollection(collection)) {
        return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
      }
      const cleanId = sanitizeDocId(id);
      const result = await upsertDocument(collection, cleanId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error saving document' });
    }
  });

  app.put('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!isAllowedCollection(collection)) {
        return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
      }
      const cleanId = sanitizeDocId(id);
      const result = await upsertDocument(collection, cleanId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error updating document' });
    }
  });

  app.delete('/api/mongodb/doc/:collection/:id', async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!isAllowedCollection(collection)) {
        return res.status(400).json({ success: false, message: 'Invalid or prohibited collection' });
      }
      const cleanId = sanitizeDocId(id);
      const deleted = await deleteDocument(collection, cleanId);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error deleting document' });
    }
  });

  // Dedicated user endpoints with validation
  app.post('/api/users/sync', async (req, res) => {
    try {
      const user = req.body;
      if (!user || typeof user !== 'object' || !user.id) {
        return res.status(400).json({ success: false, message: 'Invalid user payload' });
      }
      const cleanId = sanitizeDocId(user.id);
      const result = await upsertDocument('users', cleanId, user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error synchronizing user' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const cleanId = sanitizeDocId(req.params.id);
      const deleted = await deleteDocument('users', cleanId);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'Error deleting user' });
    }
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
