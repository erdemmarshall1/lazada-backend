const Page = require('../models/Page');
const Blog = require('../models/Blog');
const Faq = require('../models/Faq');
const Menu = require('../models/Menu');
const { success, fail, paginate } = require('../utils/response');

// ---- Pages ----
exports.getPages = async (req, res) => {
  try {
    const { page: p, pageSize: ps, status } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const filter = {};
    if (status !== undefined) filter.status = parseInt(status);
    const [list, total] = await Promise.all([
      Page.find(filter).sort({ sort: -1, createdAt: -1 }).skip(skip).limit(limit),
      Page.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.json(fail('Page not found'));
    res.json(success(page));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, status: 1 });
    if (!page) return res.json(fail('Page not found'));
    res.json(success(page));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createPage = async (req, res) => {
  try {
    const { title, slug, content, summary, image, metaTitle, metaDescription, sort } = req.body;
    if (!title || !slug) return res.json(fail('Title and slug required'));
    const exists = await Page.findOne({ slug });
    if (exists) return res.json(fail('Slug already exists'));
    const page = await Page.create({ title, slug, content, summary, image, metaTitle, metaDescription, sort });
    res.json(success(page, 'Page created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!page) return res.json(fail('Page not found'));
    res.json(success(page, 'Page updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.json(fail('Page not found'));
    res.json(success(null, 'Page deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Blogs ----
exports.getBlogs = async (req, res) => {
  try {
    const { page: p, pageSize: ps, status, category } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const filter = {};
    if (status !== undefined) filter.status = parseInt(status);
    if (category) filter.category = category;
    const [list, total] = await Promise.all([
      Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.json(fail('Blog not found'));
    res.json(success(blog));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 1 });
    if (!blog) return res.json(fail('Blog not found'));
    res.json(success(blog));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, slug, content, summary, image, category, tags, author, status } = req.body;
    if (!title || !slug) return res.json(fail('Title and slug required'));
    const exists = await Blog.findOne({ slug });
    if (exists) return res.json(fail('Slug already exists'));
    const blog = await Blog.create({
      title, slug, content, summary, image, category, tags: tags || [], author,
      status: status || 1,
      publishedAt: status === 1 ? new Date() : null,
    });
    res.json(success(blog, 'Blog created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateBlog = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 1) updates.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!blog) return res.json(fail('Blog not found'));
    res.json(success(blog, 'Blog updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.json(fail('Blog not found'));
    res.json(success(null, 'Blog deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- FAQs ----
exports.getFaqs = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status !== undefined) filter.status = parseInt(status);
    if (category) filter.category = category;
    const list = await Faq.find(filter).sort({ sort: 1, createdAt: -1 });
    res.json(success(list));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.json(fail('FAQ not found'));
    res.json(success(faq));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createFaq = async (req, res) => {
  try {
    const { question, answer, category, sort } = req.body;
    if (!question) return res.json(fail('Question required'));
    const faq = await Faq.create({ question, answer, category, sort });
    res.json(success(faq, 'FAQ created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faq) return res.json(fail('FAQ not found'));
    res.json(success(faq, 'FAQ updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.json(fail('FAQ not found'));
    res.json(success(null, 'FAQ deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Menus ----
exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 });
    res.json(success(menus));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getMenuByKey = async (req, res) => {
  try {
    const menu = await Menu.findOne({ key: req.params.key, status: 1 });
    if (!menu) return res.json(fail('Menu not found'));
    res.json(success(menu));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createMenu = async (req, res) => {
  try {
    const { name, key, items } = req.body;
    if (!name || !key) return res.json(fail('Name and key required'));
    const exists = await Menu.findOne({ key });
    if (exists) return res.json(fail('Key already exists'));
    const menu = await Menu.create({ name, key, items: items || [] });
    res.json(success(menu, 'Menu created'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!menu) return res.json(fail('Menu not found'));
    res.json(success(menu, 'Menu updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.json(fail('Menu not found'));
    res.json(success(null, 'Menu deleted'));
  } catch (error) { res.json(fail(error.message)); }
};