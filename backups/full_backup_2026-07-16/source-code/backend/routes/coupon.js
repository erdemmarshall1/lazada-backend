const express = require('express');
const router = express.Router();
const { adminAuth, auth } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

router.post('/create', adminAuth, couponController.create);
router.get('/list', adminAuth, couponController.list);
router.post('/:id/toggle', adminAuth, couponController.toggleStatus);
router.delete('/:id', adminAuth, couponController.remove);
router.post('/validate', auth, couponController.validate);
router.post('/apply', auth, couponController.applyToOrder);

module.exports = router;
