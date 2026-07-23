export const categoryIconMap = {
  'Lifestyle': '🌿',
  'Men Shoes': '👞',
  'Women Shoes': '👠',
  'Accessories': '👜',
  'Men Clothing': '👔',
  'Women Bags': '👛',
  'Men Bags': '💼',
  'Women Clothing': '👗',
  'Girls': '👧',
  'Boys': '👦',
  'Global Purchase': '🌐',
  'Electronics': '📱',
  'Fashion': '👕',
  'Home & Living': '🏠',
  'Beauty': '💄',
  'Sports': '⚽',
  'Gift Cards': '🎁',
  'Smartphones': '📱',
  'Laptops & Tablets': '💻',
  'Headphones & Audio': '🎧',
  'Furniture': '🪑',
  'Skincare': '🧴',
  'Makeup': '💋',
  'Fitness': '🏋️',
  'Digital Cards': '💳',
}

export const CATEGORY_FALLBACK = '📦'

export function getCategoryIcon(name) {
  if (!name) return CATEGORY_FALLBACK
  return categoryIconMap[name] || CATEGORY_FALLBACK
}
