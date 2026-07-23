<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Download the App</h1>
      <div class="info-content">
        <p class="info-lead">Take THE OUTNET with you wherever you go. Download our mobile app for exclusive access to new arrivals, member-only offers, and seamless shopping. You can also install our PWA app directly from your browser!</p>
        <h2>App Features</h2>
        <ul>
          <li>Browse thousands of designer pieces</li>
          <li>Get early access to new arrivals</li>
          <li>Exclusive member-only offers</li>
          <li>Secure checkout with fingerprint/Touch ID</li>
          <li>Real-time order tracking</li>
          <li>Personalized recommendations</li>
        </ul>
        <div class="pwa-section">
          <h2>Install as PWA</h2>
          <p class="pwa-desc">No app store needed. Install THE OUTNET directly from your browser for a fast, offline-capable experience.</p>
          <div class="install-btn-wrap">
            <button class="pwa-install-cta" @click="installPwa" v-if="installable && !isStandalone">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v14m0 0l-4-4m4 4l4-4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
              Install App
            </button>
          </div>
          <div v-if="isIOS && !isStandalone" class="ios-instructions">
            <p><strong>On iOS Safari:</strong></p>
            <p>1. Tap the <strong>Share</strong> button <span class="ios-share-icon">&uarr;</span></p>
            <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
            <p>3. Tap <strong>"Add"</strong></p>
          </div>
        </div>
        <h2>Available On</h2>
        <p><strong>iOS:</strong> Available on the App Store for iPhone and iPad</p>
        <p><strong>Android:</strong> Available on Google Play for Android devices</p>
        <h2>Download Now</h2>
        <p>Scan the QR code or search "THE OUTNET" in your device's app store to download.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

const pwa = usePwaInstall()
const installable = computed(() => pwa.isInstallable.value)
const isStandalone = computed(() => pwa.isStandalone.value)
const isIOS = computed(() => pwa.isIOS.value)

const installPwa = () => {
  if (isIOS.value) return
  pwa.triggerInstall()
}

onMounted(() => {
  pwa.init()
})
</script>

<style scoped>
.info-page { flex: 1; background: #faf8f4; padding: 40px 0; min-height: 60vh; }
.info-container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 4px; padding: 48px; }
.info-title { font-size: 28px; font-weight: 300; letter-spacing: 3px; margin-bottom: 32px; color: #000; }
.info-lead { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 32px; }
.info-content h2 { font-size: 18px; font-weight: 600; letter-spacing: 1px; margin: 32px 0 16px; color: #000; }
.info-content p { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 16px; }
.info-content ul { list-style: none; padding: 0; }
.info-content ul li { font-size: 14px; line-height: 1.8; color: #555; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.info-content ul li:last-child { border-bottom: none; }
.pwa-section { background: #f0eeff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #d4cfff; }
.pwa-section h2 { margin-top: 0; }
.pwa-desc { color: #555; margin-bottom: 16px; }
.install-btn-wrap { margin-bottom: 16px; }
.pwa-install-cta { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
.pwa-install-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(102,126,234,0.35); }
.ios-instructions { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.8; }
.ios-instructions p { margin: 4px 0; }
.ios-share-icon { display: inline-block; font-size: 18px; }
@media (max-width: 768px) {
  .info-page { padding: 20px 0; }
  .info-container { padding: 24px; margin: 0 12px; }
  .info-title { font-size: 22px; }
  .pwa-section { padding: 16px; }
}
</style>
