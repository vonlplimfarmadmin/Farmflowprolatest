import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const PRODUCTION_DB_NAME = 'farmflow_db';

let isConnected = false;
let lastError: string | null = null;
let connectingPromise: Promise<{ success: boolean; message?: string; dbName?: string }> | null = null;

// Production Candidates for connection targeting farmflow_db
const DEFAULT_FALLBACK_URIS = [
  // Primary connection string with farmflow_db database
  'mongodb+srv://vonlplimfarm_db_user:kv5FvZZDssnVJ0Vk@farmflowv3.qlbn8c1.mongodb.net/farmflow_db?retryWrites=true&w=majority&appName=farmflowv3',
  // Alternative formatting targeting farmflow_db
  'mongodb+srv://vonlplimfarm_db_userkv5FvZZDssnVJ0Vk:@farmflowv3.qlbn8c1.mongodb.net/farmflow_db?retryWrites=true&w=majority&appName=farmflowv3',
  'mongodb+srv://vonlplimfarm_db_userkv5FvZZDssnVJ0Vk:@farmflowv3.qlbn8c1.mongodb.net/?appName=farmflowv3'
];

// Setup global mongoose connection event listeners once
if (typeof mongoose !== 'undefined' && mongoose.connection) {
  mongoose.connection.on('connected', () => {
    isConnected = true;
    lastError = null;
    console.log(`✅ [MongoDB] Active connection to database [${mongoose.connection.name || PRODUCTION_DB_NAME}] established.`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn(`⚠️ [MongoDB] Disconnected from database [${PRODUCTION_DB_NAME}]. Will attempt automatic reconnect.`);
  });

  mongoose.connection.on('error', (err: any) => {
    lastError = err?.message || String(err);
    console.error(`❌ [MongoDB] Runtime connection error:`, err?.message || err);
  });
}

export async function connectDB(customUri?: string): Promise<{ success: boolean; message?: string; dbName?: string }> {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    lastError = null;
    return { success: true, dbName: mongoose.connection.name || PRODUCTION_DB_NAME };
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const urisToTry: string[] = [];

    if (customUri && customUri.trim()) {
      urisToTry.push(customUri.trim());
    }

    if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
      urisToTry.push(process.env.MONGODB_URI.trim());
    }

    // Also include fallback URIs
    for (const fb of DEFAULT_FALLBACK_URIS) {
      if (!urisToTry.includes(fb)) {
        urisToTry.push(fb);
      }
    }

    for (const uri of urisToTry) {
      try {
        // Mask credentials for console log
        const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log(`🔄 [MongoDB] Connecting to production database [${PRODUCTION_DB_NAME}] via: ${masked}`);

        // Disconnect any lingering socket if in connecting/disconnecting state
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect().catch(() => {});
        }

        await mongoose.connect(uri, {
          dbName: PRODUCTION_DB_NAME,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 25,
          minPoolSize: 2,
        });

        isConnected = true;
        lastError = null;
        console.log(`✅ [MongoDB] Successfully connected to production database: ${mongoose.connection.name || PRODUCTION_DB_NAME}`);
        return { success: true, dbName: mongoose.connection.name || PRODUCTION_DB_NAME };
      } catch (error: any) {
        const errMsg = error.message || String(error);
        if (errMsg.includes('whitelist') || errMsg.includes('Could not connect to any servers')) {
          lastError = 'MongoDB Atlas requires IP Whitelisting: Go to Atlas -> Security -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).';
        } else if (errMsg.includes('authentication failed') || errMsg.includes('bad auth')) {
          lastError = 'Authentication failed: Check your database username and password in Atlas -> Database Access.';
        } else {
          lastError = errMsg;
        }
        console.warn(`⚠️ [MongoDB] Connection attempt failed for ${PRODUCTION_DB_NAME}:`, lastError);
      }
    }

    isConnected = false;
    return { success: false, message: lastError || `Failed to connect to MongoDB production database: ${PRODUCTION_DB_NAME}` };
  })().finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
}

export function getDBStatus() {
  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateStr = states[readyState] || 'Unknown';
  
  return {
    connected: readyState === 1,
    state: stateStr,
    dbName: mongoose.connection.name || (readyState === 1 ? PRODUCTION_DB_NAME : PRODUCTION_DB_NAME),
    hasUriConfigured: true,
    lastError: readyState === 1 ? null : lastError,
  };
}
