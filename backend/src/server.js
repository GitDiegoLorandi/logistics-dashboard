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
const backgroundJobRoutes = require('./routes/backgroundJobRoutes');

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
    origin: [
      config.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://gitdiegolorandi.github.io',
      /localhost:\d+$/, // Allow any localhost port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle OPTIONS requests manually to ensure they work
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth-specific rate limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 attempts per IP
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
app.use('/api/jobs', backgroundJobRoutes);

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
server.listen(PORT, async () => {
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

  // Start background jobs
  try {
    const { jobManager } = require('./jobs');
    console.log('\n⏰ Initializing background jobs...');
    await jobManager.startAllJobs();
    console.log(
      '🔧 Background jobs management available at: http://localhost:' +
        PORT +
        '/api/jobs/dashboard'
    );
  } catch (error) {
    console.error('❌ Failed to start background jobs:', error);
    console.error('⚠️  Server will continue running without background jobs');
  }
});

// Graceful shutdown handling
const gracefulShutdown = signal => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    console.log('🔌 HTTP server closed');

    // Stop background jobs
    try {
      const { jobManager } = require('./jobs');
      if (jobManager.isRunning) {
        jobManager.stopAllJobs();
        console.log('⏰ Background jobs stopped');
      }
    } catch (error) {
      console.error('⚠️  Error stopping background jobs:', error);
    }

    // Close database connection
    require('mongoose').connection.close(() => {
      console.log('📦 Database connection closed');
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      '❌ Could not close connections in time, forcefully shutting down'
    );
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
