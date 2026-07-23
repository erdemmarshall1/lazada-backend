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

/**
 * @openapi
 * /home/report/dashboard:
 *   get:
 *     tags: [Reports]
 *     summary: Get dashboard overview stats
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats (users, products, orders, revenue)
 */
router.get('/dashboard', adminAuth, requireReportView, reportController.getDashboard);

/**
 * @openapi
 * /home/report/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Sales report with date range and grouping
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, month, year] }
 *     responses:
 *       200:
 *         description: Sales overview, time series, top products
 */
router.get('/sales', adminAuth, requireReportView, reportController.getSalesReport);

/**
 * @openapi
 * /home/report/customers:
 *   get:
 *     tags: [Reports]
 *     summary: Customer report with role breakdown
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User counts, roles, top customers
 */
router.get('/customers', adminAuth, requireReportView, reportController.getCustomerReport);

/**
 * @openapi
 * /home/report/inventory:
 *   get:
 *     tags: [Reports]
 *     summary: Inventory report with low stock alerts
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: lowStock
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Stock levels, inventory value, low stock items
 */
router.get('/inventory', adminAuth, requireReportView, reportController.getInventoryReport);

/**
 * @openapi
 * /home/report/financial:
 *   get:
 *     tags: [Reports]
 *     summary: Financial report (revenue, refunds, profit)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Gross/net revenue, refunds, estimated profit
 */
router.get('/financial', adminAuth, requireReportView, reportController.getFinancialReport);

/**
 * @openapi
 * /home/report/products:
 *   get:
 *     tags: [Reports]
 *     summary: Product performance report
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [salesCount, revenue, rating] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product list with sales, revenue, ratings
 */
router.get('/products', adminAuth, requireReportView, reportController.getProductPerformance);

module.exports = router;
