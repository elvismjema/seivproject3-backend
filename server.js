
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './app/models/index.js';
import routes from './app/routes/index.js';

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:8081',
    'http://localhost:5173',
    'https://project2.eaglesoftwareteam.com',
    'http://project2.eaglesoftwareteam.com',
    'https://project2.eaglesoftwareteam.com/seiv2025/p3/t2',
    'http://project3.eaglesoftwareteam.com',
    'https://project3.eaglesoftwareteam.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Database sync and server start
const PORT = process.env.PORT || 3122;
const ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Test the database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models
    // force: true will drop the table if it already exists
    // alter: true will update the table if it exists
    const syncOptions = {
      force: ENV === 'test', // Only force in test environment
      alter: ENV === 'development' // Alter in development
    };
    
    console.log('🔄 Syncing database...');
    await db.sequelize.sync(syncOptions);
    console.log('✅ Database synced successfully');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT} in ${ENV} mode.`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Only start the server if this file is run directly (not when imported for tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
