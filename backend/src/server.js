import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { autoSeedIfEmpty } from './seeds/seedData.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Project Management API Server running on port ${PORT}`);
      console.log(`📚 Interactive Swagger Docs: http://localhost:${PORT}/api/docs`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`====================================================`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
