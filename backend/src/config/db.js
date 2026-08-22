import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let mongod = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_management_db';

  try {
    // Attempt connecting to the configured URI (Atlas or Local MongoDB) with short timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] Connected to MongoDB at: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[DB] Could not connect to external/local MongoDB (${err.message}). Starting in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[DB] Connected to In-Memory MongoDB Server at: ${inMemoryUri}`);
      return conn;
    } catch (memErr) {
      console.error('[DB] Failed to start in-memory MongoDB server:', memErr);
      throw memErr;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[DB] MongoDB disconnected successfully.');
  } catch (err) {
    console.error('[DB] Error during disconnection:', err);
  }
};
