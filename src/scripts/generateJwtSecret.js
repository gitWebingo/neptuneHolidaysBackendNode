import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to .env file (2 levels up from scripts directory)
const envFilePath = path.resolve(__dirname, '../../.env');

// Generate a secure random string for JWT
const generateSecureSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Update JWT_SECRET in .env file
const updateJwtSecret = () => {
  try {
    // Read the .env file
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Check if JWT_SECRET is empty
    if (envContent.includes('JWT_SECRET=') && !envContent.match(/JWT_SECRET=(.+)/)) {
      console.log('JWT_SECRET is empty, generating a new one...');
      
      // Generate a new secure secret
      const newSecret = generateSecureSecret();
      
      // Replace the empty JWT_SECRET with the new one
      envContent = envContent.replace(/JWT_SECRET=/, `JWT_SECRET=${newSecret}`);
      
      // Write the updated content back to the .env file
      fs.writeFileSync(envFilePath, envContent);
      
      console.log('JWT_SECRET has been generated and stored in .env file');
    } else {
      console.log('JWT_SECRET already exists in .env file');
    }
  } catch (error) {
    console.error('Error updating JWT_SECRET:', error);
  }
};

// Run the function if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateJwtSecret();
}

export { updateJwtSecret }; 