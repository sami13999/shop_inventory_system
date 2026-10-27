const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from candidate paths
const candidateEnvPaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'shop_inventory_system', '.env')
];

const envPath = candidateEnvPaths.find(p => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { testDbConnection } = require('./config/db');
const authService = require('./modules/auth/auth.service');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Shop Inventory & POS API',
    version: '1.0.0',
    status: 'Running',
    docs: '/api/health'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  console.log('='.repeat(55));
  console.log('  Starting Shop Inventory & POS Management Server');
  console.log('='.repeat(55));

  const dbOk = await testDbConnection();
  if (dbOk) {
    // Seed admin if database has no users
    await authService.autoSeedAdminIfEmpty();
  } else {
    console.warn('[Warning] Running server with database connectivity issues.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Express server listening on http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
    console.log('='.repeat(55));
  });
}

startServer().catch(err => {
  console.error('[Fatal Error] Failed to start server:', err);
  process.exit(1);
});
