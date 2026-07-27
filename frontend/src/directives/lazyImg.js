const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target
      const src = img.dataset.src
      if (src) {
        img.src = src
        img.removeAttribute('data-src')
      }
      observer.unobserve(img)
    }
  })
}, { rootMargin: '200px 0px' })

export default {
  mounted(el) {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img')
    if (!img) return
    if (img.complete && img.naturalWidth) return
    const src = img.getAttribute('src')
    if (src && src !== img.src) {
      img.removeAttribute('src')
      img.dataset.src = src
      observer.observe(img)
    }
  },
  unmounted(el) {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img')
    if (img) observer.unobserve(img)
  },
}
