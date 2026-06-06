'use strict';
require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const MongoStore = require('connect-mongo');
const helmet   = require('helmet');
const path     = require('path');
const fs       = require('fs');

// Connect to MongoDB
require('./lib/db');

// Register Mongoose models (also creates default admin on first run)
require('./lib/models/User');
require('./lib/models/Place');

// Configure Passport strategies
const passport = require('./lib/auth');

const app = express();

// Ensure the places image directory exists
const IMG_DIR = path.join(__dirname, 'public', 'img', 'places');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// Security headers — CSP is relaxed to allow CDN assets used by the frontend
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com"],
      imgSrc:      ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      connectSrc:  ["'self'", "cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com"],
      fontSrc:     ["'self'", "data:", "cdn.jsdelivr.net"]
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret-change-me',
  store:             MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/demo' }),
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve the static frontend
app.use(express.static(path.join(__dirname, 'public')));

// REST API routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/places', require('./routes/places'));

// For any unknown API path, return JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// For all other paths, serve the SPA index so client-side routing works
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
