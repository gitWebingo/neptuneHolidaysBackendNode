#!/usr/bin/env node

import { updateJwtSecret } from './generateJwtSecret.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI script with more output
console.log('JWT Secret Generator');
console.log('--------------------');

// Update the JWT_SECRET in .env
updateJwtSecret();

// Read the .env file to check if JWT_SECRET is set now
try {
  const envFilePath = path.resolve(__dirname, '../../.env');
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Check if JWT_SECRET is set
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  
  if (jwtSecretMatch && jwtSecretMatch[1]) {
    console.log('\nJWT_SECRET is set in .env file');
    console.log('JWT_SECRET length:', jwtSecretMatch[1].length, 'characters');
    
    // Print security recommendation
    console.log('\nSecurity Recommendation:');
    console.log('- Keep your JWT_SECRET confidential');
    console.log('- Do not commit the .env file to version control');
    console.log('- Consider rotating the secret periodically for production environments');
  } else {
    console.log('\nWARNING: Failed to set JWT_SECRET in .env file');
    console.log('Please set it manually in your .env file');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

console.log('\nDone!'); 