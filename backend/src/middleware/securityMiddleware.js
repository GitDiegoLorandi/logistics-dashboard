const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');

/**
 * Configure security middleware for the application
 * @param {Object} config - Environment configuration
 * @returns {Array} Array of middleware functions
 */
const configureSecurityMiddleware = config => {
  const middleware = [];

  // 1. Logging middleware
  if (config.NODE_ENV === 'development') {
    middleware.push(morgan('dev'));
  } else {
    middleware.push(morgan('combined'));
  }

  // 2. Security headers with Helmet
  middleware.push(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'",
            config.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:3001',
            'https://gitdiegolorandi.github.io',
          ],
        },
      },
      crossOriginEmbedderPolicy: false, // For Swagger UI
    })
  );

  // 3. Role-based Rate limiting
  const standardLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests from this IP',
      message: `Please try again after ${config.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`,
      retryAfter: config.RATE_LIMIT_WINDOW_MS / 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks and admin users
    skip: req => {
      // Skip for health checks
      if (req.path === '/api/health') return true;

      // Skip for admin users - extract token and check role
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(
            token,
            config.JWT_SECRET
          );
          if (decoded && decoded.role === 'admin') {
            return true; // Skip rate limiting for admins
          }
        }
      } catch (err) {
        // If token verification fails, apply rate limiting
      }

      return false;
    },
  });
  middleware.push(standardLimiter);

  // 4. Auth-specific rate limiting is configured in server.js
  // Note: Stricter rate limiting for auth endpoints is applied directly in server.js

  // 5. NoSQL injection prevention
  middleware.push(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(
          `⚠️  Sanitized NoSQL injection attempt: ${key} from IP: ${req.ip}`
        );
      },
    })
  );

  // 6. Response compression
  middleware.push(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
    })
  );

  return middleware;
};

/**
 * Configure additional security for Socket.IO
 * @param {Object} config - Environment configuration
 * @returns {Object} Socket.IO configuration
 */
const configureSocketSecurity = config => {
  return {
    cors: {
      origin: [
        config.SOCKET_IO_CORS_ORIGIN,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://gitdiegolorandi.github.io',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  };
};

module.exports = {
  configureSecurityMiddleware,
  configureSocketSecurity,
};
