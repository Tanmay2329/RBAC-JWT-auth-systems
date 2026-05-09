require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { port } = require('./config/config');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const cors = require('cors');
const {
  swaggerUi,
  swaggerSpec
} = require('./swagger');
const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}));

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());                          // Sets secure HTTP headers
app.use(express.json({ limit: '10kb' }));   // Limit payload size
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(
    swaggerSpec
  )
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

if (
  !process.env.JWT_ACCESS_SECRET ||
  !process.env.JWT_REFRESH_SECRET
) {
  throw new Error(
    'JWT secrets missing'
  );
}

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, () => {
    console.log(`\n🔐 Auth System running on port ${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Auth:   http://localhost:${port}/auth`);
    console.log(`   API:    http://localhost:${port}/api\n`);
  });
}

module.exports = app;
