import dotenv from 'dotenv/config';
import app from './app.js';
import serverConfig from './config/server.js';
import { testDatabaseConnection } from './config/database.js';
import { initializeDatabase } from './database/index.js';


const { port } = serverConfig;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Start server
const server = app.listen(port, async () => {
  // Test database connection
  await testDatabaseConnection();
  
  // Initialize database (sync models with database)
  await initializeDatabase(false); // Set to true to force sync (drop tables)
  
  console.log(`Server running on port ${port}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
}); 