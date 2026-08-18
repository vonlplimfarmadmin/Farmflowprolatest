import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let lastError: string | null = null;

// Candidates for connection: environment variable or user-provided URI
const DEFAULT_FALLBACK_URIS = [
  // User string with username:password split
  'mongodb+srv://vonlplimfarm_db_user:kv5FvZZDssnVJ0Vk@farmflowv3.qlbn8c1.mongodb.net/farmflow_db?retryWrites=true&w=majority&appName=farmflowv3',
  // User string exact format with farmflow_db database
  'mongodb+srv://vonlplimfarm_db_userkv5FvZZDssnVJ0Vk:@farmflowv3.qlbn8c1.mongodb.net/farmflow_db?retryWrites=true&w=majority&appName=farmflowv3',
  // User string as provided
  'mongodb+srv://vonlplimfarm_db_userkv5FvZZDssnVJ0Vk:@farmflowv3.qlbn8c1.mongodb.net/?appName=farmflowv3'
];

export async function connectDB(customUri?: string): Promise<{ success: boolean; message?: string; dbName?: string }> {
  const urisToTry: string[] = [];

  if (customUri && customUri.trim()) {
    urisToTry.push(customUri.trim());
  }

  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    urisToTry.push(process.env.MONGODB_URI.trim());
  }

  // Also include the fallback URIs
  for (const fb of DEFAULT_FALLBACK_URIS) {
    if (!urisToTry.includes(fb)) {
      urisToTry.push(fb);
    }
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    lastError = null;
    return { success: true, dbName: mongoose.connection.name };
  }

  for (const uri of urisToTry) {
    try {
      // Mask credentials for console log
      const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
      console.log(`🔄 [MongoDB] Attempting connection to: ${masked}`);

      // Disconnect any lingering socket if in connecting/disconnecting state
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      isConnected = true;
      lastError = null;
      console.log('✅ [MongoDB] Successfully connected to MongoDB:', mongoose.connection.name || 'farmflow_db');
      return { success: true, dbName: mongoose.connection.name || 'farmflow_db' };
    } catch (error: any) {
      const errMsg = error.message || String(error);
      if (errMsg.includes('whitelist') || errMsg.includes('Could not connect to any servers')) {
        lastError = 'MongoDB Atlas requires IP Whitelisting: Go to Atlas -> Security -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).';
      } else if (errMsg.includes('authentication failed') || errMsg.includes('bad auth')) {
        lastError = 'Authentication failed: Check your database username and password in Atlas -> Database Access.';
      } else {
        lastError = errMsg;
      }
      console.warn('⚠️ [MongoDB] Connection attempt failed:', lastError);
    }
  }

  isConnected = false;
  return { success: false, message: lastError || 'Failed to connect to MongoDB Atlas' };
}

export function getDBStatus() {
  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateStr = states[readyState] || 'Unknown';
  
  return {
    connected: readyState === 1,
    state: stateStr,
    dbName: mongoose.connection.name || (readyState === 1 ? 'farmflow_db' : null),
    hasUriConfigured: true,
    lastError: readyState === 1 ? null : lastError,
  };
}
