'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load env FIRST before anything else
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Verify critical env vars
const JWT_SECRET = process.env.JWT_SECRET || 'connectsphere_fallback_secret_key_2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/connectsphere';
const PORT = parseInt(process.env.PORT) || 5000;

console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️  MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/avatars', 'uploads/posts', 'uploads/stories', 'uploads/covers'];
uploadDirs.forEach(dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const app = express();

// ---- Security ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for SPA
}));

// ---- CORS ----
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.options('*', cors()); // Pre-flight

// ---- Rate Limiting ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use('/api/auth', authLimiter);
app.use('/api/', generalLimiter);

// ---- Body Parsing ----
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ---- Logging ----
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Static Files ----
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true,
}));
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

// ---- API Routes ----
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/comments',      require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stories',       require('./routes/stories'));
app.use('/api/search',        require('./routes/search'));
app.use('/api/messages',      require('./routes/messages'));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ConnectSphere API is healthy',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// ---- SPA Fallback ----
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route not found' });
  }
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages[0], errors: messages });
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `This ${field} is already taken` });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired, please login again' });
  }
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 5MB allowed.' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ---- Database Connection ----
const connectDB = async () => {
  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, opts);
    console.log('✅ MongoDB connected successfully');
    console.log('📦 Database:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('💡 Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('🔄 MongoDB reconnected'));

// ---- Start Server ----
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ╔═══════════════════════════════════════╗');
    console.log('   ║     ConnectSphere is running! 🌐      ║');
    console.log(`   ║  http://localhost:${PORT}                 ║`);
    console.log('   ╚═══════════════════════════════════════╝');
    console.log('');
  });
});

module.exports = app;
