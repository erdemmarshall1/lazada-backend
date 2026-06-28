<template>
  <div v-if="pwa.showBanner.value">
    <div v-if="mode === 'popup'" class="pwa-overlay" @click.self="pwa.dismiss()">
      <div class="pwa-popup">
        <button class="pwa-popup-close" @click="pwa.dismiss()">&times;</button>
        <div class="pwa-popup-icon">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--g-main_color)" stroke-width="1.5"><path d="M12 2v14m0 0l-4-4m4 4l4-4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
        </div>
        <h3 class="pwa-popup-title">Install Shopify Wholesale</h3>
        <p class="pwa-popup-desc">Get the fastest experience with our PWA app. Works on iOS, Android &amp; Windows.</p>
        <div v-if="pwa.isIOS.value" class="pwa-ios-instructions">
          <p>1. Tap the <strong>Share</strong> button <span class="ios-share-icon">&#8593;</span> in Safari</p>
          <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
          <p>3. Tap <strong>"Add"</strong> in the top right corner</p>
        </div>
        <button v-else class="pwa-install-btn" @click="install">Install App</button>
        <button class="pwa-later-btn" @click="pwa.dismiss()">Maybe Later</button>
      </div>
    </div>

    <div v-else-if="mode === 'homepage'" class="pwa-home-banner">
      <div class="pwa-home-content">
        <div class="pwa-home-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--g-main_color)" stroke-width="1.5"><path d="M12 2v14m0 0l-4-4m4 4l4-4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
        </div>
        <div class="pwa-home-text">
          <strong>Get the App</strong>
          <span>Install Shopify Wholesale on your device for the best experience</span>
        </div>
        <button v-if="!pwa.isIOS.value" class="pwa-install-btn-sm" @click="install">Install</button>
        <button v-else class="pwa-install-btn-sm" @click="pwa.dismiss()">How to Install</button>
        <button class="pwa-close-btn" @click="pwa.dismiss()">&times;</button>
      </div>
    </div>

    <div v-else-if="mode === 'footer'" class="pwa-footer-banner">
      <div class="pwa-footer-inner">
        <div class="pwa-footer-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v14m0 0l-4-4m4 4l4-4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
        </div>
        <span class="pwa-footer-text">Download our app for iOS, Android &amp; Windows</span>
        <button v-if="!pwa.isIOS.value" class="pwa-install-btn-xs" @click="install">Install</button>
        <span v-else class="pwa-footer-ios-hint">Share &rarr; Add to Home Screen</span>
        <button class="pwa-close-btn-xs" @click="pwa.dismiss()">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePwaInstall } from '@/composables/usePwaInstall'

const props = defineProps({
  mode: { type: String, default: 'popup', validator: v => ['popup', 'homepage', 'footer'].includes(v) },
})

const pwa = usePwaInstall()

const install = () => {
  if (pwa.isIOS.value) return
  pwa.triggerInstall()
}
</script>

<style scoped>
/* ─── Popup Overlay ─── */
.pwa-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.pwa-popup {
  background: var(--g-white, #1e1e1e);
  border-radius: 16px; padding: 36px 28px 24px;
  max-width: 400px; width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.pwa-popup-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: #999; line-height: 1;
}
.pwa-popup-close:hover { color: #fff; }
.pwa-popup-icon { margin-bottom: 12px; }
.pwa-popup-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
.pwa-popup-desc { font-size: 14px; color: #999; margin: 0 0 20px; line-height: 1.5; }

/* iOS instructions */
.pwa-ios-instructions { text-align: left; font-size: 14px; line-height: 1.8; margin-bottom: 20px; }
.pwa-ios-instructions p { margin: 6px 0; }
.ios-share-icon { display: inline-block; font-size: 16px; font-weight: 700; }
.pwa-install-btn {
  display: block; width: 100%; padding: 12px;
  background: var(--g-main_color); color: #fff; border: none; border-radius: 8px;
  font-size: 16px; font-weight: 600; cursor: pointer;
}
.pwa-install-btn:hover { filter: brightness(1.1); }
.pwa-later-btn {
  display: block; width: 100%; padding: 10px; margin-top: 10px;
  background: none; border: 1px solid #444; border-radius: 8px;
  font-size: 14px; color: #999; cursor: pointer;
}
.pwa-later-btn:hover { color: #fff; border-color: #666; }

/* ─── Homepage Banner ─── */
.pwa-home-banner {
  background: var(--g-white, #1e1e1e);
  border-radius: 12px; padding: 16px 20px;
  margin: 20px auto; max-width: var(--g-main-width);
  border: 1px solid #333;
}
.pwa-home-content {
  display: flex; align-items: center; gap: 14px;
}
.pwa-home-icon { flex-shrink: 0; }
.pwa-home-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.pwa-home-text strong { font-size: 15px; }
.pwa-home-text span { font-size: 13px; color: #999; }
.pwa-install-btn-sm {
  padding: 8px 20px; background: var(--g-main_color); color: #fff;
  border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.pwa-install-btn-sm:hover { filter: brightness(1.1); }
.pwa-close-btn {
  background: none; border: none; font-size: 22px; color: #666;
  cursor: pointer; line-height: 1; padding: 0 4px; flex-shrink: 0;
}
.pwa-close-btn:hover { color: #fff; }

/* ─── Footer Banner ─── */
.pwa-footer-banner {
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
}
.pwa-footer-inner {
  display: flex; align-items: center; gap: 12px;
  max-width: var(--g-main-width); margin: 0 auto;
  padding: 10px 16px;
}
.pwa-footer-icon { flex-shrink: 0; color: var(--g-main_color); display: flex; }
.pwa-footer-text { flex: 1; font-size: 13px; color: #ccc; }
.pwa-install-btn-xs {
  padding: 6px 16px; background: var(--g-main_color); color: #fff;
  border: none; border-radius: 5px; font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.pwa-install-btn-xs:hover { filter: brightness(1.1); }
.pwa-footer-ios-hint { font-size: 12px; color: var(--g-main_color); white-space: nowrap; flex-shrink: 0; }
.pwa-close-btn-xs {
  background: none; border: none; font-size: 18px; color: #555;
  cursor: pointer; line-height: 1; padding: 0; flex-shrink: 0;
}
.pwa-close-btn-xs:hover { color: #fff; }

@media (max-width: 768px) {
  .pwa-popup { max-width: 94%; padding: 28px 20px 20px; }
  .pwa-home-banner { margin: 16px 12px; padding: 14px; }
  .pwa-home-text span { font-size: 12px; }
  .pwa-footer-inner { flex-wrap: wrap; gap: 8px; }
  .pwa-footer-text { width: 100%; order: -1; }
}
</style>
