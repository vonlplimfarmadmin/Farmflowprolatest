import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB, getDBStatus } from './server/db';
import { EggRecordModel } from './server/models/EggRecord';
import { FlockModel } from './server/models/Flock';
import { FeedRecordModel } from './server/models/FeedRecord';
import { FarmProfileModel } from './server/models/FarmProfile';
import { 
  DepletionModel, 
  MedAdminModel, 
  BodyWeightModel, 
  BiosecurityLogModel 
} from './server/models/FarmCollections';
import { UserAccountModel } from './server/models/UserAccount';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initial attempt to connect to MongoDB if MONGODB_URI is present
  connectDB().catch((err) => {
    console.warn('[MongoDB] Initial connection error:', err);
  });

  // ==========================================
  // API Routes
  // ==========================================

  // 1. Health & Database Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'FarmFlow Pro API',
      timestamp: new Date().toISOString(),
      database: getDBStatus(),
    });
  });

  app.get('/api/db/status', async (req, res) => {
    const status = getDBStatus();
    let stats = {
      eggRecordsCount: 0,
      flocksCount: 0,
      feedRecordsCount: 0,
      depletionsCount: 0,
      medAdminsCount: 0,
      bodyWeightsCount: 0,
      biosecurityLogsCount: 0,
      usersCount: 0,
    };

    if (status.connected) {
      try {
        stats.eggRecordsCount = await EggRecordModel.countDocuments();
        stats.flocksCount = await FlockModel.countDocuments();
        stats.feedRecordsCount = await FeedRecordModel.countDocuments();
        stats.depletionsCount = await DepletionModel.countDocuments();
        stats.medAdminsCount = await MedAdminModel.countDocuments();
        stats.bodyWeightsCount = await BodyWeightModel.countDocuments();
        stats.biosecurityLogsCount = await BiosecurityLogModel.countDocuments();
        stats.usersCount = await UserAccountModel.countDocuments();
      } catch (err: any) {
        console.warn('Error reading count stats:', err.message);
      }
    }

    res.json({
      ...status,
      stats,
    });
  });

  app.post('/api/db/connect', async (req, res) => {
    const { uri } = req.body || {};
    const result = await connectDB(uri);
    res.json({
      success: result.success,
      message: result.message,
      status: getDBStatus(),
    });
  });

  // 1.1 Pull All Database Data (For Mobile Auto-Hydration)
  app.get('/api/db/pull-all', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, message: 'MongoDB not connected' });
      }

      const [eggRecords, flocks, feedRecords, farmProfile, depletions, medAdmins, bodyWeights, biosecurityLogs, users] = await Promise.all([
        EggRecordModel.find().sort({ date: -1 }).lean(),
        FlockModel.find().sort({ houseNumber: 1 }).lean(),
        FeedRecordModel.find().sort({ date: -1 }).lean(),
        FarmProfileModel.findOne({ id: 'farm_profile_main' }).lean(),
        DepletionModel.find().sort({ date: -1 }).lean(),
        MedAdminModel.find().sort({ date: -1 }).lean(),
        BodyWeightModel.find().sort({ date: -1 }).lean(),
        BiosecurityLogModel.find().sort({ date: -1 }).lean(),
        UserAccountModel.find().sort({ createdAt: -1 }).lean(),
      ]);

      res.json({
        connected: true,
        data: {
          eggRecords,
          flocks,
          feedRecords,
          farmProfile,
          depletions,
          medAdmins,
          bodyWeights,
          biosecurityLogs,
          users,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to pull all records from MongoDB', details: err.message });
    }
  });

  // 2. Egg Production Records
  app.get('/api/egg-records', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, records: [] });
      }

      const records = await EggRecordModel.find().sort({ date: -1 });
      res.json({ connected: true, records });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch egg records', details: err.message });
    }
  });

  app.post('/api/egg-records', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, message: 'MongoDB not connected. Saved in local cache only.' });
      }

      const recordData = req.body;
      const recordId = recordData.id || `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const record = await EggRecordModel.findOneAndUpdate(
        { id: recordId },
        { ...recordData, id: recordId },
        { upsert: true, new: true }
      );

      res.json({ connected: true, record });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save egg record', details: err.message });
    }
  });

  app.delete('/api/egg-records/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      await EggRecordModel.deleteOne({ id: req.params.id });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete record', details: err.message });
    }
  });

  // 3. Flocks
  app.get('/api/flocks', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, flocks: [] });
      }

      const flocks = await FlockModel.find().sort({ houseNumber: 1 });
      res.json({ connected: true, flocks });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch flocks', details: err.message });
    }
  });

  app.post('/api/flocks', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const flockData = req.body;
      const flock = await FlockModel.findOneAndUpdate(
        { houseNumber: flockData.houseNumber },
        flockData,
        { upsert: true, new: true }
      );

      res.json({ connected: true, flock });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save flock', details: err.message });
    }
  });

  // 4. Feed Records
  app.get('/api/feed-records', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, records: [] });
      }

      const records = await FeedRecordModel.find().sort({ date: -1 });
      res.json({ connected: true, records });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch feed records', details: err.message });
    }
  });

  app.post('/api/feed-records', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const record = await FeedRecordModel.findOneAndUpdate(
        { id: req.body.id },
        req.body,
        { upsert: true, new: true }
      );

      res.json({ connected: true, record });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save feed record', details: err.message });
    }
  });

  app.delete('/api/feed-records/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      await FeedRecordModel.deleteOne({ id: req.params.id });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete feed record', details: err.message });
    }
  });

  // 4.1 Depletions & Mortalities
  app.post('/api/depletions', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const depletion = await DepletionModel.findOneAndUpdate(
        { id: req.body.id },
        req.body,
        { upsert: true, new: true }
      );

      res.json({ connected: true, depletion });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save depletion', details: err.message });
    }
  });

  app.delete('/api/depletions/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      await DepletionModel.deleteOne({ id: req.params.id });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete depletion', details: err.message });
    }
  });

  // 4.2 Medication & Vaccine Administrations
  app.post('/api/med-admins', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const medAdmin = await MedAdminModel.findOneAndUpdate(
        { id: req.body.id },
        req.body,
        { upsert: true, new: true }
      );

      res.json({ connected: true, medAdmin });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save medication administration', details: err.message });
    }
  });

  app.delete('/api/med-admins/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      await MedAdminModel.deleteOne({ id: req.params.id });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete medication administration', details: err.message });
    }
  });

  // 4.3 Body Weights
  app.post('/api/body-weights', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const bodyWeight = await BodyWeightModel.findOneAndUpdate(
        { id: req.body.id },
        req.body,
        { upsert: true, new: true }
      );

      res.json({ connected: true, bodyWeight });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save body weight record', details: err.message });
    }
  });

  app.delete('/api/body-weights/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      await BodyWeightModel.deleteOne({ id: req.params.id });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete body weight record', details: err.message });
    }
  });

  // 4.4 Biosecurity Logs
  app.post('/api/biosecurity-logs', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const log = await BiosecurityLogModel.findOneAndUpdate(
        { id: req.body.id },
        req.body,
        { upsert: true, new: true }
      );

      res.json({ connected: true, log });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save biosecurity log', details: err.message });
    }
  });

  // 5. Farm Profile
  app.get('/api/farm-profile', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const profile = await FarmProfileModel.findOne({ id: 'farm_profile_main' });
      res.json({ connected: true, profile });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch farm profile', details: err.message });
    }
  });

  app.post('/api/farm-profile', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const profile = await FarmProfileModel.findOneAndUpdate(
        { id: 'farm_profile_main' },
        { ...req.body, id: 'farm_profile_main' },
        { upsert: true, new: true }
      );

      res.json({ connected: true, profile });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update farm profile', details: err.message });
    }
  });

  // 6. Batch Sync All Farm Data to MongoDB
  app.post('/api/db/sync-all', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.status(400).json({
          connected: false,
          error: 'MongoDB is not connected. Please verify connection or network whitelist in Atlas.',
        });
      }

      const { 
        eggRecords, 
        flocks, 
        feedRecords, 
        farmProfile,
        depletions,
        medAdmins,
        bodyWeights,
        biosecurityLogs,
        users
      } = req.body;

      let insertedEggs = 0;
      let insertedFlocks = 0;
      let insertedFeed = 0;
      let insertedDepletions = 0;
      let insertedMedAdmins = 0;
      let insertedBodyWeights = 0;
      let insertedBiosecurity = 0;
      let insertedUsers = 0;

      if (Array.isArray(users) && users.length > 0) {
        for (const u of users) {
          if (u.id || u.username) {
            await UserAccountModel.findOneAndUpdate(
              { username: u.username },
              u,
              { upsert: true }
            );
            insertedUsers++;
          }
        }
      }

      if (Array.isArray(eggRecords) && eggRecords.length > 0) {
        for (const record of eggRecords) {
          await EggRecordModel.findOneAndUpdate(
            { id: record.id },
            record,
            { upsert: true }
          );
          insertedEggs++;
        }
      }

      if (Array.isArray(flocks) && flocks.length > 0) {
        for (const flock of flocks) {
          await FlockModel.findOneAndUpdate(
            { houseNumber: flock.houseNumber },
            flock,
            { upsert: true }
          );
          insertedFlocks++;
        }
      }

      if (Array.isArray(feedRecords) && feedRecords.length > 0) {
        for (const feed of feedRecords) {
          await FeedRecordModel.findOneAndUpdate(
            { id: feed.id },
            feed,
            { upsert: true }
          );
          insertedFeed++;
        }
      }

      if (Array.isArray(depletions) && depletions.length > 0) {
        for (const dep of depletions) {
          await DepletionModel.findOneAndUpdate(
            { id: dep.id },
            dep,
            { upsert: true }
          );
          insertedDepletions++;
        }
      }

      if (Array.isArray(medAdmins) && medAdmins.length > 0) {
        for (const med of medAdmins) {
          await MedAdminModel.findOneAndUpdate(
            { id: med.id },
            med,
            { upsert: true }
          );
          insertedMedAdmins++;
        }
      }

      if (Array.isArray(bodyWeights) && bodyWeights.length > 0) {
        for (const bw of bodyWeights) {
          await BodyWeightModel.findOneAndUpdate(
            { id: bw.id },
            bw,
            { upsert: true }
          );
          insertedBodyWeights++;
        }
      }

      if (Array.isArray(biosecurityLogs) && biosecurityLogs.length > 0) {
        for (const bio of biosecurityLogs) {
          await BiosecurityLogModel.findOneAndUpdate(
            { id: bio.id },
            bio,
            { upsert: true }
          );
          insertedBiosecurity++;
        }
      }

      if (farmProfile) {
        await FarmProfileModel.findOneAndUpdate(
          { id: 'farm_profile_main' },
          { ...farmProfile, id: 'farm_profile_main' },
          { upsert: true }
        );
      }

      res.json({
        success: true,
        connected: true,
        message: 'All farm records synced to MongoDB successfully.',
        counts: {
          eggRecords: insertedEggs,
          flocks: insertedFlocks,
          feedRecords: insertedFeed,
          depletions: insertedDepletions,
          medAdmins: insertedMedAdmins,
          bodyWeights: insertedBodyWeights,
          biosecurityLogs: insertedBiosecurity,
          users: insertedUsers,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Sync failed', details: err.message });
    }
  });

  // 6.1 Users Collection Endpoints
  app.get('/api/users', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, users: [] });
      }

      const users = await UserAccountModel.find().sort({ createdAt: -1 });
      res.json({ connected: true, users });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false, message: 'MongoDB not connected' });
      }

      const userData = req.body;
      const user = await UserAccountModel.findOneAndUpdate(
        { username: userData.username },
        userData,
        { upsert: true, new: true }
      );

      res.json({ connected: true, user });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save user', details: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({ connected: false });
      }

      const { id } = req.params;
      await UserAccountModel.deleteOne({ $or: [{ id }, { username: id }] });
      res.json({ connected: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete user', details: err.message });
    }
  });

  // 7. Clear Database & Wipe for New Cycle
  app.post('/api/db/clear-all', async (req, res) => {
    try {
      const status = getDBStatus();
      if (!status.connected) {
        return res.json({
          success: true,
          connected: false,
          message: 'Local reset only (MongoDB was not connected).',
        });
      }

      await EggRecordModel.deleteMany({});
      await FlockModel.deleteMany({});
      await FeedRecordModel.deleteMany({});
      await DepletionModel.deleteMany({});
      await MedAdminModel.deleteMany({});
      await BodyWeightModel.deleteMany({});
      await BiosecurityLogModel.deleteMany({});
      
      res.json({
        success: true,
        connected: true,
        message: 'MongoDB database successfully cleared for a new flock cycle.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear database', details: err.message });
    }
  });

  // ==========================================
  // Vite Middleware & SPA Static Serving
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [FarmFlow Pro] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
