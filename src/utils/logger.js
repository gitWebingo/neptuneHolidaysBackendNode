import serverConfig from '../config/server.js';

const isDevelopment = serverConfig.nodeEnv === 'development';

const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

export default logger; 