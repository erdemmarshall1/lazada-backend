const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const settings = require('../controllers/settingsController');

// ---- General Settings ----
router.get('/settings', adminAuth, settings.getSettings);
router.put('/settings', adminAuth, settings.updateSetting);
router.post('/settings/bulk', adminAuth, settings.bulkUpdateSettings);

// ---- Tax Rates ----
router.get('/tax-rates', adminAuth, settings.getTaxRates);
router.post('/tax-rates', adminAuth, settings.createTaxRate);
router.put('/tax-rates/:id', adminAuth, settings.updateTaxRate);
router.delete('/tax-rates/:id', adminAuth, settings.deleteTaxRate);

// ---- Currencies ----
router.get('/currencies', adminAuth, settings.getCurrencies);
router.post('/currencies', adminAuth, settings.createCurrency);
router.put('/currencies/:id', adminAuth, settings.updateCurrency);
router.delete('/currencies/:id', adminAuth, settings.deleteCurrency);

// ---- Shipping Methods ----
router.get('/shipping-methods', adminAuth, settings.getShippingMethods);
router.post('/shipping-methods', adminAuth, settings.createShippingMethod);
router.put('/shipping-methods/:id', adminAuth, settings.updateShippingMethod);
router.delete('/shipping-methods/:id', adminAuth, settings.deleteShippingMethod);

module.exports = router;
