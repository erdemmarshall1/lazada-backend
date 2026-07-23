const generateOrderNo = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${y}${m}${d}${h}${mi}${s}${ms}${rand}`;
};

const maskString = (str, showFirst = 2, showLast = 2) => {
  if (!str) return '';
  if (str.length <= showFirst + showLast) return str;
  return str.substring(0, showFirst) + '****' + str.substring(str.length - showLast);
};

const calculateDiscountPrice = (price, discount) => {
  if (!discount || discount >= 1) return price;
  return Math.round(price * discount * 100) / 100;
};

const formatFloat = (num, decimals = 2) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const getStatusColor = (status) => {
  const colors = { 0: 'red', 1: 'green', 2: 'blue', 3: 'blue' };
  return colors[status] || 'gray';
};

module.exports = {
  generateOrderNo,
  maskString,
  calculateDiscountPrice,
  formatFloat,
  getStatusColor,
};
