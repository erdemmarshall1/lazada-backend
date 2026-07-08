const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const { PERMISSIONS, hasPermission } = require('../config/roles');

const requireReportView = (req, res, next) => {
  if (!hasPermission(req.user, PERMISSIONS.REPORTS_VIEW)) {
    return res.status(403).json({ code: 1, msg: 'Permission denied: reports:view required' });
  }
  next();
};

router.get('/dashboard', adminAuth, requireReportView, reportController.getDashboard);
router.get('/sales', adminAuth, requireReportView, reportController.getSalesReport);
router.get('/customers', adminAuth, requireReportView, reportController.getCustomerReport);
router.get('/inventory', adminAuth, requireReportView, reportController.getInventoryReport);
router.get('/financial', adminAuth, requireReportView, reportController.getFinancialReport);
router.get('/products', adminAuth, requireReportView, reportController.getProductPerformance);

module.exports = router;
