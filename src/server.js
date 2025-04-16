import dotenv from 'dotenv/config';
import app from './app.js';
import serverConfig from './config/server.js';
import { testDatabaseConnection } from './config/database.js';
import { initializeDatabase } from './database/index.js';
import { connectRedis } from './utils/redisClient.js';
import { updateJwtSecret } from './scripts/generateJwtSecret.js';
import logger from './utils/logger.js';

const { port } = serverConfig;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Start server
const server = app.listen(port, async () => {
  // Check if JWT_SECRET is set and generate one if empty
  updateJwtSecret();
  
  // Test database connection
  await testDatabaseConnection();
  
  // Initialize database (sync models with database)
  await initializeDatabase(false); // Set to true to force sync (drop tables)
  
  // Connect to Redis
  try {
    await connectRedis();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    if (serverConfig.nodeEnv === 'production') {
      logger.error('Exiting application due to Redis connection failure in production');
      process.exit(1);
    } else {
      logger.warn('Continuing without Redis in development mode');
    }
  }
  
  logger.info(`Server running on port ${port} in ${serverConfig.nodeEnv} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
}); 