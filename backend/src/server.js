const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config');
const { displayEnvInfo } = require('./config/envValidation');
const {
  configureSecurityMiddleware,
} = require('./middleware/securityMiddleware');
const { setupSwagger } = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const delivererRoutes = require('./routes/delivererRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

console.log('✅ Environment validation passed');

const app = express();
const server = http.createServer(app);
const PORT = config.PORT;

// Connect to MongoDB
connectDB();

// Phase 2: Security Middleware
const securityMiddleware = configureSecurityMiddleware(config);
securityMiddleware.forEach(middleware => {
  if (Array.isArray(middleware)) {
    app.use(...middleware);
  } else {
    app.use(middleware);
  }
});

// CORS Configuration
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth-specific rate limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deliverers', delivererRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/statistics', statisticsRoutes);

// Phase 2: API Documentation
setupSwagger(app, config);

// Health check endpoint (Enhanced)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    database: 'Connected',
    version: '1.0.0',
    features: {
      security: {
        rateLimit: true,
        helmet: true,
        mongoSanitize: true,
        compression: true,
      },
      documentation: config.API_DOCS_ENABLED,
      logging: true,
    },
    memory: {
      used:
        Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total:
        Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(config.NODE_ENV === 'development' && { error: err.message }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  if (config.API_DOCS_ENABLED) {
    console.log(
      `📚 API Documentation: http://localhost:${PORT}${config.API_DOCS_PATH}`
    );
  }
  console.log(
    '🛡️  Security features enabled: Rate limiting, Helmet, NoSQL injection prevention, Compression'
  );

  // Display environment configuration
  displayEnvInfo(config);

  if (config.NODE_ENV === 'development') {
    console.log(`\n📱 Frontend URL: ${config.FRONTEND_URL}`);
    console.log(
      '🛠️  Development mode: Error details will be shown in responses'
    );
  }
});
