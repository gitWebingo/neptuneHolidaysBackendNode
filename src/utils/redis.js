import { createClient } from 'redis';
import serverConfig from '../config/server.js';

// Initialize Redis client with configuration from server config
const client = createClient({
  url: serverConfig.redisUrl || 'redis://localhost:6379',
});

// Handle connection errors
client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Connection handling
const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log('Connected to Redis successfully');
    }
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Get data from Redis
const getFromRedis = async (key) => {
  try {
    await connectRedis();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting data from Redis for key ${key}:`, error);
    return null;
  }
};

// Set data in Redis with expiration
const setInRedis = async (key, value, expiresInSeconds = 3600) => {
  try {
    await connectRedis();
    await client.set(key, JSON.stringify(value), {
      EX: expiresInSeconds
    });
    return true;
  } catch (error) {
    console.error(`Error setting data in Redis for key ${key}:`, error);
    return false;
  }
};

// Delete data from Redis
const deleteFromRedis = async (key) => {
  try {
    await connectRedis();
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting data from Redis for key ${key}:`, error);
    return false;
  }
};

// Check if key exists in Redis
const existsInRedis = async (key) => {
  try {
    await connectRedis();
    return await client.exists(key);
  } catch (error) {
    console.error(`Error checking if key ${key} exists in Redis:`, error);
    return false;
  }
};

// Close the Redis connection
const closeRedisConnection = async () => {
  if (client.isOpen) {
    await client.quit();
    console.log('Redis connection closed');
  }
};

export {
  client,
  connectRedis,
  getFromRedis,
  setInRedis,
  deleteFromRedis,
  existsInRedis,
  closeRedisConnection
}; 