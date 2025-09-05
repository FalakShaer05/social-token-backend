/**
 * Social Token Backend API Server
 * Main entry point for the NFT Marketplace RESTful API
 * 
 * Features:
 * - User authentication with Passport.js
 * - MongoDB database connection
 * - Session management
 * - CORS support
 * - SSH tunnel support for remote database connections
 */

// Load environment variables
require('dotenv').config();

// Core dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const logger = require('morgan');
const MongoStore = require('connect-mongo');
const path = require('path');

// Optional dependencies
const tunnel = require('tunnel-ssh');

// Configuration
const settings = require('./server-settings');

// Initialize Express app
const app = express();

// Set mongoose promise and configure strictQuery
mongoose.Promise = Promise;
mongoose.set('strictQuery', false); // Suppress deprecation warning

// Configure views directory (for static HTML files)
app.set('views', path.join(__dirname, 'views'));

// Server configuration
const port = process.env.PORT || settings.server.port || 3000;
const environment = process.env.NODE_ENV || 'development';

// Disable console.log in production (except for startup logs)
if (environment !== 'development') {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Allow startup and error logs even in production
    if (args[0] && (
      args[0].includes('🚀') || 
      args[0].includes('✅') || 
      args[0].includes('❌') || 
      args[0].includes('Database') ||
      args[0].includes('Server') ||
      args[0].includes('Error')
    )) {
      originalConsoleLog(...args);
    }
  };
}

// Startup logging
console.log('🚀 Starting Social Token Backend API Server...');
console.log(`📋 Environment: ${environment}`);
console.log(`🔧 Port: ${port}`);

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-JSON');
  res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Auth-Token,X-Requested-With,Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  next();
});

/**
 * Start the Express server with database connection
 * @param {Object} db - MongoDB connection object
 * @param {string} dbConnectString - Database connection string
 */
function startServer(db, dbConnectString) {
  console.log('🔧 Configuring Express middleware...');
  
  // Cookie parser
  app.use(cookieParser(`${settings.server.name} SessionSecret`));
  
  // Body parsers
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  // Session configuration
  app.use(
    session({
      store: MongoStore.create({ mongoUrl: dbConnectString }),
      name: `${settings.server.name} Cookie`,
      secret: `${settings.server.name} SessionSecret`,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: settings.server.sessionDurationSeconds * 1000
      }
    })
  );

  // Passport authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Request logging (development only)
  if (environment === 'development') {
    app.use(logger('dev'));
  }
  
  // Session middleware
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {};
    }
    next();
  });
  
  // Database middleware
  app.use((req, res, next) => {
    req.database = db;
    next();
  });
  
  // Graceful shutdown handlers
  const cleanup = function () {
    console.log('🛑 Shutting down server gracefully...');
    db.close();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // API Routes
  console.log('📡 Setting up API routes...');
  
  // Welcome Route
  app.get('/', (req, res) => {
    const welcomeMessage = {
      message: "Welcome to the Social Token NFT Marketplace API",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      environment: environment
    };
    res.json(welcomeMessage);
  });

  // Health check route
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: db.readyState === 1 ? 'connected' : 'disconnected'
    });
  });

  // Legacy heartbeat route
  app.get('/heartbeat', (req, res) => res.sendStatus(200));

  // Support form route (direct access)
  app.get('/support', (req, res) => {
    res.redirect('/v1/support');
  });

  // API Routes
  try {
    const PublicRouter = require('./v1/routes/router-public')(db, settings);
    const PrivateRouter = require('./v1/routes/router-private')(db, settings);
    
    app.use('/v1', PublicRouter);
    app.use('/v1', PrivateRouter);
    
    console.log('✅ API routes loaded successfully');
  } catch (error) {
    console.error('❌ Error loading API routes:', error.message);
    throw error;
  }

  // Error handling middleware
  console.log('🛡️ Setting up error handling...');
  
  // 404 handler
  app.use((req, res, next) => {
    const err = new Error('Route Not Found');
    err.status = 404;
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
      timestamp: new Date().toISOString()
    });
  });

  // Development error handler
  if (environment === 'development') {
    app.use((err, req, res, next) => {
      console.error('❌ Development Error:', err);
      res.status(err.status || 500).json({
        message: err.message,
        error: err,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Production error handler
  app.use((err, req, res, next) => {
    console.error('❌ Production Error:', err.message);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: environment === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  });

  // Start server
  const server = app.listen(port, () => {
    console.log('✅ Server started successfully!');
    console.log(`🌐 ${settings.server.name} is running on port ${port}`);
    console.log(`🔗 Local: http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📋 Environment: ${environment}`);
    console.log('🚀 Ready to accept connections!');
  });

  // Server error handling
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
}

/**
 * Initialize database connection
 * @param {Object} config - Database configuration
 * @param {Function} next - Callback function to start server
 */
function startDB(config, next) {
  console.log('🔌 Connecting to MongoDB...');
  console.log(`📊 Database: ${config.db.connectionString.replace(/\/\/.*@/, '//***:***@')}`);
  
  // MongoDB connection options
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false
  };

  mongoose.connect(config.db.connectionString, mongoOptions);

  const db = mongoose.connection;

  // Database connection error handling
  db.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
    console.error('❌ Full error:', err);
    db.close();
    process.exit(1);
  });

  // Database connection timeout
  db.on('disconnected', () => {
    console.warn('⚠️ Database disconnected');
  });

  // Database reconnection
  db.on('reconnected', () => {
    console.log('🔄 Database reconnected');
  });

  // Successful database connection
  db.once('open', () => {
    console.log('✅ Database connected successfully!');
    console.log(`📊 Database name: ${db.name}`);
    console.log(`🔗 Database host: ${db.host}`);
    console.log(`🔌 Database port: ${db.port}`);
    console.log('🚀 Starting server...');
    next(db, config.db.connectionString);
  });
}

// Application startup
console.log('🎯 Initializing application...');

if (settings.server.ssh.enabled) {
  console.log('🔐 SSH tunnel enabled - connecting to remote database...');
  
  const sshConfig = {
    username: settings.server.ssh.user,
    password: settings.server.ssh.password,
    host: settings.database.url,
    port: 22,
    dstHost: 'localhost',
    dstPort: settings.database.port,
    tryKeyboard: true
  };

  const tunnel = tunnel(sshConfig, (error, server) => {
    if (error) {
      console.error('❌ SSH connection error:', error.message);
      process.exit(1);
      return;
    }

    console.log('✅ SSH tunnel established');
    const localConnectionString = `mongodb://localhost:${sshConfig.dstPort}/${settings.database.connectionString.split('/').pop()}`;
    startDB({ db: { connectionString: localConnectionString } }, startServer);
  });

  tunnel.on('error', (err) => {
    console.error('❌ SSH tunnel error:', err.message);
    tunnel.close();
    process.exit(1);
  });

  tunnel.on('keyboard-interactive', (name, descr, lang, prompts, finish) => {
    const { password } = sshConfig;
    return finish([password]);
  });
} else {
  console.log('🔗 Connecting to local database...');
  startDB({ db: { connectionString: settings.database.connectionString } }, startServer);
}

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

console.log('🎉 Application initialization complete!');
