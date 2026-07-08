const express = require('express');
const router = express.Router();
const cms = require('../controllers/cmsController');
const { adminAuth } = require('../middleware/auth');

// ---- Public routes ----
router.get('/page/:slug', cms.getPageBySlug);
router.get('/blog/:slug', cms.getBlogBySlug);
router.get('/faqs', cms.getFaqs);
router.get('/menu/:key', cms.getMenuByKey);
router.get('/blogs', cms.getBlogs);

// ---- Admin: Pages ----
router.get('/admin/pages', adminAuth, cms.getPages);
router.get('/admin/pages/:id', adminAuth, cms.getPageById);
router.post('/admin/pages', adminAuth, cms.createPage);
router.put('/admin/pages/:id', adminAuth, cms.updatePage);
router.delete('/admin/pages/:id', adminAuth, cms.deletePage);

// ---- Admin: Blogs ----
router.get('/admin/blogs', adminAuth, cms.getBlogs);
router.get('/admin/blogs/:id', adminAuth, cms.getBlogById);
router.post('/admin/blogs', adminAuth, cms.createBlog);
router.put('/admin/blogs/:id', adminAuth, cms.updateBlog);
router.delete('/admin/blogs/:id', adminAuth, cms.deleteBlog);

// ---- Admin: FAQs ----
router.get('/admin/faqs', adminAuth, cms.getFaqs);
router.get('/admin/faqs/:id', adminAuth, cms.getFaqById);
router.post('/admin/faqs', adminAuth, cms.createFaq);
router.put('/admin/faqs/:id', adminAuth, cms.updateFaq);
router.delete('/admin/faqs/:id', adminAuth, cms.deleteFaq);

// ---- Admin: Menus ----
router.get('/admin/menus', adminAuth, cms.getMenus);
router.post('/admin/menus', adminAuth, cms.createMenu);
router.put('/admin/menus/:id', adminAuth, cms.updateMenu);
router.delete('/admin/menus/:id', adminAuth, cms.deleteMenu);

module.exports = router;