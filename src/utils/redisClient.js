import { createClient } from 'redis';
import serverConfig from '../config/server.js';
import logger from './logger.js';

// Redis connection configuration
const redisUrl = serverConfig.redisUrl;
const sessionTTL = serverConfig.redisSessionTTL;

// Create Redis client
const client = createClient({
  url: redisUrl
});

// Connect to Redis
const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      logger.info('Redis client connected successfully');
    }
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Allow the application to continue without Redis in development
    if (serverConfig.nodeEnv === 'production') {
      throw error; // In production, fail if Redis is unavailable
    }
    return false;
  }
};

// Handle connection errors
client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

/**
 * Store a session in Redis
 * @param {string} type - 'user' or 'admin'
 * @param {string|number} id - User/Admin ID
 * @param {object} data - Session data
 * @param {number} [ttl] - Session time-to-live in seconds
 * @returns {Promise<boolean>} - Success status
 */
const storeSession = async (type, id, data, ttl = sessionTTL) => {
  try {
    const key = `session:${type}:${id}`;
    await client.set(key, JSON.stringify(data));
    await client.expire(key, ttl);
    logger.debug(`Stored ${type} session for ID ${id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to store ${type} session:`, error);
    return false;
  }
};

/**
 * Get a session from Redis
 * @param {string} type - 'user' or 'admin'
 * @param {string|number} id - User/Admin ID
 * @returns {Promise<object|null>} - Session data or null
 */
const getSession = async (type, id) => {
  try {
    const key = `session:${type}:${id}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Failed to get ${type} session:`, error);
    return null;
  }
};

/**
 * Remove a session from Redis
 * @param {string} type - 'user' or 'admin' 
 * @param {string|number} id - User/Admin ID
 * @returns {Promise<boolean>} - Success status
 */
const removeSession = async (type, id) => {
  try {
    const key = `session:${type}:${id}`;
    await client.del(key);
    logger.debug(`Removed ${type} session for ID ${id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove ${type} session:`, error);
    return false;
  }
};

// Admin session functions
const storeAdminSession = (id, data, ttl) => storeSession('admin', id, data, ttl);
const getAdminSession = (id) => getSession('admin', id);
const removeAdminSession = (id) => removeSession('admin', id);

// User session functions
const storeUserSession = (id, data, ttl) => storeSession('user', id, data, ttl);
const getUserSession = (id) => getSession('user', id);
const removeUserSession = (id) => removeSession('user', id);

/**
 * Check if a user is already logged in (has active session)
 * @param {string} type - 'user' or 'admin'
 * @param {string|number} id - User/Admin ID
 * @returns {Promise<boolean>} - True if user has active session
 */
const isLoggedIn = async (type, id) => {
  const session = await getSession(type, id);
  return session !== null;
};

// Export functions
export {
  client,
  connectRedis,
  storeAdminSession,
  getAdminSession,
  removeAdminSession,
  storeUserSession,
  getUserSession,
  removeUserSession,
  isLoggedIn
}; 