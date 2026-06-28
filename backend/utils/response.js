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

module.exports = { success, fail, paginate };
