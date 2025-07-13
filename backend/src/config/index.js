require('dotenv').config();
const { validateEnv } = require('./envValidation');

// Validate and export configuration
let config;
try {
  config = validateEnv();
} catch (error) {
  console.error(
    '💥 Failed to load configuration due to environment validation errors'
  );
  throw error;
}

module.exports = config;
