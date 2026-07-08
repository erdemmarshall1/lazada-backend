const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const sessionCtrl = require('../controllers/sessionController');

// ---- User's own sessions ----
router.get('/my-sessions', auth, sessionCtrl.getMySessions);
router.post('/sessions/:id/revoke', auth, sessionCtrl.revokeSession);
router.post('/sessions/revoke-all', auth, sessionCtrl.revokeAllSessions);

// ---- Admin: Sessions ----
router.get('/admin/sessions', adminAuth, sessionCtrl.adminGetSessions);
router.post('/admin/sessions/:id/revoke', adminAuth, sessionCtrl.adminRevokeSession);

// ---- Admin: Audit Logs ----
router.get('/admin/audit-logs', adminAuth, sessionCtrl.getAuditLogs);

module.exports = router;
