const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { success, fail, paginate } = require('../utils/response');

// ---- Public: Submit a contact/inquiry form ----
router.post('/submissions', async (req, res) => {
  try {
    const { name, email, phone, subject, category, message, attachments } = req.body;
    if (!name || !email || !subject || !message) {
      return res.json(fail('Name, email, subject, and message are required'));
    }
    const userId = req.user?._id || null;
    const submission = await Submission.create({ userId, name, email, phone, subject, category, message, attachments });

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id').lean();
    await Promise.all(admins.map(a =>
      createNotification(a._id, 'system', 'New Inquiry', `${name} submitted: ${subject}`,
        { submissionId: submission._id }, '/admin/submissions')
    ));

    res.json(success({ id: submission._id }, 'Inquiry submitted successfully'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- User auth: get my submissions ----
router.get('/submissions/my', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { skip, limit } = paginate(page, pageSize);
    const filter = { userId: req.user._id };
    const [list, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Submission.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- User: get single submission detail ----
router.get('/submissions/my/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) return res.json(fail('Submission not found'));
    res.json(success(submission));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: list all submissions ----
router.get('/admin/submissions', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, category, search } = req.query;
    const { skip, limit } = paginate(page, pageSize);
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }
    const [list, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'username email avatar role').populate('repliedBy', 'username'),
      Submission.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: get single submission ----
router.get('/admin/submissions/:id', adminAuth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('userId', 'username email avatar phone role createdAt').populate('repliedBy', 'username');
    if (!submission) return res.json(fail('Submission not found'));
    res.json(success(submission));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: update submission status ----
router.put('/admin/submissions/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.json(fail('Invalid status'));
    }
    const update = { status };
    if (status === 'replied') {
      update.repliedAt = new Date();
      update.repliedBy = req.user._id;
    }
    const submission = await Submission.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!submission) return res.json(fail('Submission not found'));
    res.json(success(submission, 'Status updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: update admin notes/reply ----
router.put('/admin/submissions/:id/notes', adminAuth, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const submission = await Submission.findByIdAndUpdate(req.params.id, { $set: { adminNotes } }, { new: true });
    if (!submission) return res.json(fail('Submission not found'));
    res.json(success(submission, 'Notes updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: delete submission ----
router.delete('/admin/submissions/:id', adminAuth, async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return res.json(fail('Submission not found'));
    res.json(success(null, 'Submission deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

module.exports = router;