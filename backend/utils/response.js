const CLOUDINARY_BASE = 'https://res.cloudinary.com/u7xxu5dq/image/upload';
const DEAD_DOMAINS = ['outnetsource.top', 's3.amazonaws.com'];

const isDeadUrl = (url) => {
  if (!url) return false;
  if (url.startsWith('/uploads/') || url.startsWith('/assets/')) return false;
  try {
    const host = new URL(url).hostname;
    return DEAD_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
};

const rewriteProductImages = (product) => {
  if (!product || !product._id) return;
  const cloudUrl = `${CLOUDINARY_BASE}/products/${product._id}`;
  if (product.images && Array.isArray(product.images)) {
    product.images = product.images.map(img => isDeadUrl(img) ? cloudUrl : img);
  }
};

const success = (data = null, msg = 'success') => {
  return { code: 0, msg, data };
};

const fail = (msg = 'fail', code = -2) => {
  return { code, msg };
};

const paginate = (page = 1, pageSize = 20) => {
  const p = Math.max(1, parseInt(page));
  const s = Math.min(100, Math.max(1, parseInt(pageSize)));
  return { skip: (p - 1) * s, limit: s, page: p, pageSize: s };
};

module.exports = { success, fail, paginate, rewriteProductImages };
