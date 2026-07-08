export const imgUrl = (url) => {
  if (!url) return ''
  return url
}

export const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00'
  if (typeof price === 'string') return price
  return Number(price).toFixed(2)
}
