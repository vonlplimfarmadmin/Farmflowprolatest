import express from 'express';
import dotenv from 'dotenv';
import {
  createRateLimiter,
  securityHeadersMiddleware,
  dynamicCacheControlMiddleware,
  netlifyPathNormalizerMiddleware,
} from './server/middleware/securityMiddleware.ts';
import {
  connectDB,
  databaseGuardMiddleware,
  ensureInitialData,
  getTargetDbName,
  lastConnectionError,
  activeDbName,
  cachedPromise,
} from './server/config/databaseConnection.ts';
import { apiRouter } from './server/routes/apiRoutes.ts';

dotenv.config();

export const app = express();

// Prevent server technology fingerprinting
app.disable('x-powered-by');

// Global HTTP Security, Payload Limits, Cache-Control & Path Normalization
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(dynamicCacheControlMiddleware);
app.use(netlifyPathNormalizerMiddleware);

// API Rate Limiting, Database Readiness Guard & Modular Route Controller
app.use('/api', createRateLimiter(5000, 60 * 1000));
app.use('/api', databaseGuardMiddleware);
app.use('/api', apiRouter);

export {
  connectDB,
  ensureInitialData,
  getTargetDbName,
  lastConnectionError,
  activeDbName,
  cachedPromise,
};
