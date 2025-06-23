const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config');
const { displayEnvInfo } = require('./config/envValidation');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const delivererRoutes = require('./routes/delivererRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

console.log('✅ Environment validation passed');

const app = express();
const PORT = config.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deliverers', delivererRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    database: 'Connected',
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

  // Display environment configuration
  displayEnvInfo(config);

  if (config.NODE_ENV === 'development') {
    console.log(`\n📱 Frontend URL: ${config.FRONTEND_URL}`);
    console.log(
      '🛠️  Development mode: Error details will be shown in responses'
    );
  }
});
