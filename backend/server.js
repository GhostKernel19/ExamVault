/**
 * ExamVault - Backend Server
 * 
 * Secure exam paper distribution system with cryptographic key management
 * and blockchain-ready tamper-evident logging.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const paperRoutes = require('./routes/paper');
const logger = require('./utils/logger');
const { getPublicCenters } = require('./utils/mockCenters');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/paper', paperRoutes);

// Health Check & Service Info Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ExamVault Backend API',
    version: '1.0.0',
    status: 'ONLINE',
    description: 'Secure exam paper distribution system using AES-256-GCM, RSA-OAEP key wrapping, and blockchain audit logs',
    config: {
      port: PORT,
      rpcUrl: process.env.RPC_URL || 'Not configured',
      contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed',
      simulateReleasePassed: process.env.SIMULATE_RELEASE_PASSED === 'true'
    },
    authorizedCentersCount: getPublicCenters().length,
    endpoints: {
      uploadPaper: 'POST /api/paper/upload (multipart/form-data with "paper")',
      listCenters: 'GET /api/paper/centers',
      releaseKey: 'GET /api/paper/:paperId/release-key?centerId=:centerId',
      auditLog: 'GET /api/paper/:paperId/audit-log',
      downloadEncrypted: 'GET /api/paper/:paperId/download-encrypted',
      simulateRelease: 'POST /api/paper/:paperId/simulate-release'
    }
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.success(`ExamVault server running on http://localhost:${PORT}`);
    logger.info(`Ready for paper upload and tamper-evident audit logging.`);
    logger.crypto(`AES-256-GCM encryption & RSA-OAEP key wrapping initialized.`);
  });
}

module.exports = app;
