require('dotenv').config();
const express = require('express');
const { runMigrations } = require('./db/migrate');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Required for Railway / reverse proxies
const server = http.createServer(app);

// ─── Socket.IO (In-App Chat) ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });
  socket.on('disconnect', () => {});
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 3 });
app.use('/api/v1/auth/otp', otpLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/auth'));
app.use('/api/v1/properties',    require('./routes/properties'));
app.use('/api/v1/search',        require('./routes/search'));
app.use('/api/v1/scouts',        require('./routes/scouts'));
app.use('/api/v1/verifications', require('./routes/verifications'));
app.use('/api/v1/transactions',  require('./routes/transactions'));
app.use('/api/v1/chat',          require('./routes/chat'));
app.use('/api/v1/visits',        require('./routes/visits'));
app.use('/api/v1/price-oracle',  require('./routes/priceOracle'));
app.use('/api/v1/payments',      require('./routes/payments'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
runMigrations().then(() => {
  server.listen(PORT, () => console.log(`KeyTurn API running on port ${PORT}`));
}).catch(err => {
  console.error('Startup migration error:', err.message);
  server.listen(PORT, () => console.log(`KeyTurn API running on port ${PORT} (migration skipped)`));
});

module.exports = { app, io };