const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(5000),

  // Support both MONGO_URI and MONGODB_URI for flexibility
  MONGO_URI: Joi.string().optional(),
  MONGODB_URI: Joi.string().optional(),

  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret must be at least 32 characters long'),

  JWT_EXPIRES_IN: Joi.string().default('24h'),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(15).default(12),

  // Optional environment variables
  DB_NAME: Joi.string().optional(),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000), // 15 minutes

  RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(500),

  // Phase 2 - Real-time Features
  SOCKET_IO_CORS_ORIGIN: Joi.string().uri().default('http://localhost:3000'),

  // Phase 2 - API Documentation
  API_DOCS_ENABLED: Joi.boolean().default(true),
  API_DOCS_PATH: Joi.string().default('/api-docs'),
})
  .unknown() // Allow other environment variables
  .required();

/**
 * Validate environment variables
 * @returns {Object} Validated environment configuration
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details
      .map(detail => {
        return `❌ ${detail.context.label}: ${detail.message}`;
      })
      .join('\n');

    console.error('🚨 Environment Validation Failed:');
    console.error(errorMessages);
    console.error(
      '\n💡 Please check your .env file and ensure all required variables are set correctly.'
    );

    throw new Error('Environment validation failed');
  }

  // Handle MongoDB URI - support both MONGO_URI and MONGODB_URI
  const mongoUri = value.MONGO_URI || value.MONGODB_URI;
  if (!mongoUri) {
    console.error('🚨 Environment Validation Failed:');
    console.error(
      '❌ MongoDB URI: Either MONGO_URI or MONGODB_URI is required'
    );
    console.error('\n💡 Please add one of these variables to your .env file:');
    console.error('   MONGO_URI=mongodb://localhost:27017/logistics-dashboard');
    console.error('   OR');
    console.error(
      '   MONGODB_URI=mongodb://localhost:27017/logistics-dashboard'
    );
    throw new Error('Environment validation failed');
  }

  // Normalize to MONGODB_URI for internal use
  value.MONGODB_URI = mongoUri;

  return value;
}

/**
 * Display environment configuration (without sensitive data)
 * @param {Object} config - Validated configuration
 */
function displayEnvInfo(config) {
  console.log('🌍 Environment Configuration:');
  console.log(`   NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   PORT: ${config.PORT}`);
  console.log(`   FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log(`   LOG_LEVEL: ${config.LOG_LEVEL}`);
  console.log(`   JWT_EXPIRES_IN: ${config.JWT_EXPIRES_IN}`);
  console.log(`   BCRYPT_SALT_ROUNDS: ${config.BCRYPT_SALT_ROUNDS}`);
  console.log(
    `   RATE_LIMIT_WINDOW: ${config.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`
  );
  console.log(`   RATE_LIMIT_MAX: ${config.RATE_LIMIT_MAX_REQUESTS} requests`);

  // Show if sensitive variables are present (without values)
  console.log(
    `   MONGODB_URI: ${config.MONGODB_URI ? '✅ Set' : '❌ Missing'}`
  );
  console.log(`   JWT_SECRET: ${config.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
}

module.exports = {
  validateEnv,
  displayEnvInfo,
};
