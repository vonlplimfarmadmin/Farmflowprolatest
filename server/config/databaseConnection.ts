import express from 'express';
import mongoose from 'mongoose';

export let lastConnectionError: string | null = null;
export let activeDbName =
  (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || 'farmflowproviii';
export let cachedPromise: Promise<boolean> | null = null;

export function resetCachedConnectionPromise(): void {
  cachedPromise = null;
}

export const getTargetDbName = (uri: string): string => {
  const configured = process.env.MONGODB_DB_NAME;
  if (configured && configured.trim()) {
    return configured.trim();
  }
  try {
    const clean = uri.replace(/\s/g, '');
    const withoutProtocol = clean.replace(/^mongodb(\+srv)?:\/\//, '');
    const slashIndex = withoutProtocol.indexOf('/');
    if (slashIndex !== -1) {
      const pathWithQuery = withoutProtocol.substring(slashIndex + 1);
      const questionIndex = pathWithQuery.indexOf('?');
      const db = (
        questionIndex !== -1 ? pathWithQuery.substring(0, questionIndex) : pathWithQuery
      ).trim();
      if (db && !db.includes('/') && !db.startsWith('<')) {
        return db;
      }
    }
  } catch {
    // Fall back to active default
  }
  return (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim()) || 'farmflowproviii';
};

export const ensureInitialData = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return;
    }
    const db = mongoose.connection.db;

    await Promise.allSettled([
      db.collection('users').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('users').createIndex({ username: 1 }, { sparse: true }),
      db.collection('flocks').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('eggRecords').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('eggRecords').createIndex({ date: 1, houseNumber: 1 }),
      db.collection('feedRecords').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('depletions').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('bodyWeights').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('biosecurityLogs').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('auditLogs').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('auditLogs').createIndex({ timestamp: -1 }),
      db.collection('hatchingSummaries').createIndex({ id: 1 }, { unique: true, sparse: true }),
      db.collection('deliveries').createIndex({ id: 1 }, { unique: true, sparse: true }),
    ]);

    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({
      $or: [{ id: 'usr_admin' }, { username: 'admin' }, { role: 'admin' }],
    });
    if (!existingAdmin) {
      const adminUser = {
        id: 'usr_admin',
        username: 'admin',
        fullName: 'Von L.P. Lim (Owner / Admin)',
        email: 'von.lplimfarm@gmail.com',
        role: 'admin',
        status: 'active',
        designatedHouses: ['House 1', 'House 2', 'House 3', 'House 4', 'House 5', 'House 6'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        securityQuestion: 'What is your farm location?',
        securityAnswer: 'Batangas',
        contactNumber: '+63 917 555 2473',
      };
      await usersCol.updateOne({ id: 'usr_admin' }, { $set: adminUser }, { upsert: true });
      console.log('[MongoDB Seeding] Seeded initial admin user (usr_admin / admin)');
    }

    const profileCol = db.collection('farmProfile');
    const existingProfile = await profileCol.findOne({});
    if (!existingProfile) {
      const defaultProfile = {
        id: 'farmProfile',
        name: 'L.P. LIM CITY FAMILY FARM INC',
        logoUrl:
          'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=200&q=80',
        address: 'San Jose Agro-Industrial Complex, Batangas / Central Luzon, Philippines',
        contactNumber: '+63 917 555 2473 / (043) 723-8890',
        email: 'von.lplimfarm@gmail.com',
        establishedYear: '2012',
        currency: 'PHP',
        farmOwners: 'L.P. Lim & Family',
        presidentCeo: 'Von L.P. Lim',
        industrySector: 'Commercial Broiler-Breeder Parent Stock (PS)',
        primaryBreeds: 'Cobb 500 & Ross 308 Parent Stock',
        facilityHousesCount: '6 Environmentally Controlled (EC)',
        totalBirdCapacity: '~60,000 Breeders',
        dailyEggCapacity: '~50,000 Eggs/day',
        createdAt: new Date().toISOString(),
      };
      await profileCol.updateOne(
        { _id: 'farmProfile' as any },
        { $set: defaultProfile },
        { upsert: true }
      );
      console.log('[MongoDB Seeding] Seeded initial farm profile');
    }
  } catch (err: any) {
    console.error('[MongoDB] Seeding error:', err.message);
  }
};

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedPromise) {
    try {
      return await cachedPromise;
    } catch {
      // Fall through to retry if previous attempt failed
    }
  }

  cachedPromise = (async () => {
    let uri = (
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL ||
      ''
    ).trim();

    if (!uri) {
      lastConnectionError = 'MONGODB_URI environment variable is missing.';
      return false;
    }

    uri = uri.replace(/\s/g, '');
    activeDbName = getTargetDbName(uri);

    try {
      await mongoose.connect(uri, {
        dbName: activeDbName,
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      console.log(`[MongoDB] Connected successfully to database "${activeDbName}"`);
      ensureInitialData().catch(err => console.error('[MongoDB] Seeding error:', err.message));
      return true;
    } catch (err: any) {
      lastConnectionError = err.message || 'Failed to connect to MongoDB Atlas';
      console.error('[MongoDB] Connection attempt failed:', lastConnectionError);
      return false;
    }
  })();

  try {
    const success = await cachedPromise;
    if (!success) cachedPromise = null;
    return success;
  } catch {
    cachedPromise = null;
    return false;
  }
};

/**
 * Express middleware that ensures an active database connection before handling data routes.
 */
export const databaseGuardMiddleware: express.RequestHandler = async (req, res, next) => {
  if (req.path === '/health' || req.path === '/db/reconnect') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'Database connection is not established. Please verify your MONGODB_URI and IP whitelist in Atlas (allow 0.0.0.0/0).',
      dbStatus: mongoose.connection.readyState,
      errorDetails: lastConnectionError,
    });
  }
  next();
};
