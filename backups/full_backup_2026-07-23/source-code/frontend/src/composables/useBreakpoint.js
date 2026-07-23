import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useBreakpoint() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)

  let mobileMq, tabletMq

  function update() {
    if (mobileMq) isMobile.value = mobileMq.matches
    if (tabletMq) isTablet.value = tabletMq.matches
    isDesktop.value = tabletMq ? !tabletMq.matches : true
  }

  onMounted(() => {
    mobileMq = window.matchMedia('(max-width: 768px)')
    tabletMq = window.matchMedia('(max-width: 1024px)')
    update()
    mobileMq.addListener(update)
    tabletMq.addListener(update)
  })

  onBeforeUnmount(() => {
    if (mobileMq) mobileMq.removeListener(update)
    if (tabletMq) tabletMq.removeListener(update)
  })

  return { isMobile, isTablet, isDesktop }
}
