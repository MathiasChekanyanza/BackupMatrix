const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Middleware
const validateApiKey = require('../middleware/validateApiKey');
const { auth, requireRole } = require('../middleware/auth');
const { reportLimiter, apiLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

// Controllers
const reportController = require('../controllers/reportController');
const serverController = require('../controllers/serverController');
const exportController = require('../controllers/exportController');

// Report ingestion endpoint (for agents)
router.post(
  '/report',
  reportLimiter,
  validateApiKey,
  [
    body('server_name').notEmpty().withMessage('server_name is required'),
    body('backup_time').isISO8601().withMessage('backup_time must be ISO 8601 date'),
    body('status').isIn(['success', 'failed', 'partial']).withMessage('status must be success, failed, or partial'),
    validate
  ],
  reportController.ingestReport
);

// Dashboard stats (authenticated)
router.get(
  '/dashboard',
  auth,
  apiLimiter,
  serverController.getDashboardStats
);

// Server list and details (authenticated)
router.get(
  '/servers',
  auth,
  apiLimiter,
  serverController.listServers
);

router.get(
  '/servers/:id',
  auth,
  apiLimiter,
  serverController.getServerDetails
);

router.put(
  '/servers/:id',
  auth,
  requireRole(['admin', 'ops']),
  apiLimiter,
  serverController.updateServer
);

// Reports and exports (authenticated)
router.get(
  '/reports/matrix',
  auth,
  apiLimiter,
  exportController.getMatrixData
);

router.post(
  '/reports/export/pdf',
  auth,
  apiLimiter,
  exportController.exportPDF
);

router.post(
  '/reports/export/excel',
  auth,
  apiLimiter,
  exportController.exportExcel
);

module.exports = router;
