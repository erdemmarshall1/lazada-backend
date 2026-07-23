const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const settings = require('../controllers/settingsController');

/**
 * @openapi
 * /home/admin/settings/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get all general settings
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of settings key-value pairs
 */
router.get('/settings', adminAuth, settings.getSettings);
router.put('/settings', adminAuth, settings.updateSetting);

/**
 * @openapi
 * /home/admin/settings/settings/bulk:
 *   post:
 *     tags: [Settings]
 *     summary: Bulk update general settings
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string }
 *                     value: { type: string }
 *     responses:
 *       200:
 *         description: Settings saved
 */
router.post('/settings/bulk', adminAuth, settings.bulkUpdateSettings);

/**
 * @openapi
 * /home/admin/settings/tax-rates:
 *   get:
 *     tags: [Settings]
 *     summary: List all tax rates
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tax rates array
 */
router.get('/tax-rates', adminAuth, settings.getTaxRates);
router.post('/tax-rates', adminAuth, settings.createTaxRate);
router.put('/tax-rates/:id', adminAuth, settings.updateTaxRate);
router.delete('/tax-rates/:id', adminAuth, settings.deleteTaxRate);

/**
 * @openapi
 * /home/admin/settings/currencies:
 *   get:
 *     tags: [Settings]
 *     summary: List all currencies
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Currencies array
 */
router.get('/currencies', adminAuth, settings.getCurrencies);
router.post('/currencies', adminAuth, settings.createCurrency);
router.put('/currencies/:id', adminAuth, settings.updateCurrency);
router.delete('/currencies/:id', adminAuth, settings.deleteCurrency);

/**
 * @openapi
 * /home/admin/settings/shipping-methods:
 *   get:
 *     tags: [Settings]
 *     summary: List all shipping methods
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Shipping methods array
 */
router.get('/shipping-methods', adminAuth, settings.getShippingMethods);
router.post('/shipping-methods', adminAuth, settings.createShippingMethod);
router.put('/shipping-methods/:id', adminAuth, settings.updateShippingMethod);
router.delete('/shipping-methods/:id', adminAuth, settings.deleteShippingMethod);

module.exports = router;
