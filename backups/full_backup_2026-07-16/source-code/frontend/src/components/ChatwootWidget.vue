<template>
  <div>
    <div v-if="showFloatingButton" class="cw-wrapper" ref="wrapperRef">
      <!-- Floating button -->
      <button class="cw-button" :class="{ 'cw-pulse': !open }" @click.stop="toggle" aria-label="Chat">
        <svg v-if="!open" width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>

      <!-- Chat panel -->
      <transition name="cw-slide">
        <div v-if="open" class="cw-panel">
          <div class="cw-header">
            <h4>Need help?</h4>
            <p>Our support team is ready to assist you</p>
          </div>
          <div class="cw-body">
            <!-- Chatwoot Live Chat -->
            <div class="cw-option cw-chatwoot" @click="openChatwoot">
              <div class="cw-option-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--g-main_color)"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>
              </div>
              <div class="cw-option-text">
                <strong>Live Chat</strong>
                <span>Chat with us in real-time</span>
              </div>
              <span class="cw-option-arrow">&rarr;</span>
            </div>

            <!-- WhatsApp -->
            <a :href="whatsappUrl" target="_blank" rel="noopener" class="cw-option cw-whatsapp">
              <div class="cw-option-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div class="cw-option-text">
                <strong>WhatsApp</strong>
                <span>Chat with us on WhatsApp</span>
              </div>
              <span class="cw-option-arrow">&rarr;</span>
            </a>
          </div>
          <div class="cw-footer">
            <p>Typically replies within 1 hour</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- Chatwoot SDK container -->
    <div v-show="false" ref="chatwootContainer" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()
const open = ref(false)
const wrapperRef = ref(null)
const showFloatingButton = ref(false)
const chatwootLoaded = ref(false)

const PHONE_NUMBER = '14155238886'

const whatsappUrl = computed(() => `https://wa.me/${PHONE_NUMBER}?text=Hello%20THE%20OUTNET%20support%2C%20I%20need%20help`)

const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }

const handleDocumentClick = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    close()
  }
}

const loadChatwoot = () => {
  if (chatwootLoaded.value) return
  if (!store.chatwoot.websiteToken) return

  const BASE_URL = store.chatwoot.baseUrl || 'https://app.chatwoot.com'
  const s1 = document.createElement('script')
  s1.type = 'text/javascript'
  s1.async = true
  s1.src = BASE_URL + '/packs/js/sdk.js'
  s1.onerror = function () {
    const s2 = document.createElement('script')
    s2.type = 'text/javascript'
    s2.async = true
    s2.dataset.chatwootBucket = 'app'
    s2.dataset.chatwootRelease = 'latest'
    s2.src = BASE_URL + '/packs/js/sdk.js'
    document.head.appendChild(s2)
  }
  document.head.appendChild(s1)

  s1.onload = () => {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({
        websiteToken: store.chatwoot.websiteToken,
        baseUrl: BASE_URL
      })
      chatwootLoaded.value = true
    }
  }
}

const openChatwoot = () => {
  close()
  if (window.chatwootSDK) {
    window.chatwootSDK.toggle()
  } else {
    loadChatwoot()
    setTimeout(() => {
      if (window.chatwootSDK) window.chatwootSDK.toggle()
    }, 1500)
  }
}

onMounted(() => {
  if (store.chatwoot?.enabled && store.chatwoot?.websiteToken) {
    showFloatingButton.value = true
    loadChatwoot()
  }
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(() => store.chatwoot?.enabled, (enabled) => {
  if (enabled && store.chatwoot?.websiteToken) {
    showFloatingButton.value = true
    loadChatwoot()
  } else if (!enabled) {
    showFloatingButton.value = false
  }
})
</script>

<style scoped>
.cw-wrapper {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cw-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  margin-left: auto;
  border: none;
}

.cw-button:hover {
  transform: scale(1.1);
}

.cw-pulse {
  animation: cw-pulse 2s infinite;
}

@keyframes cw-pulse {
  0% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 4px 30px rgba(255, 140, 56, 0.4); }
  100% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
}

.cw-panel {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  overflow: hidden;
}

.cw-header {
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff;
  padding: 24px 20px 20px;
}

.cw-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.cw-header p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.cw-body {
  padding: 12px;
}

.cw-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
  color: inherit;
  margin-bottom: 4px;
}

.cw-option:hover {
  background: #f5f5f5;
}

.cw-option-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 12px;
}

.cw-option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cw-option-text strong {
  font-size: 14px;
  font-weight: 600;
}

.cw-option-text span {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.cw-option-arrow {
  font-size: 20px;
  color: #ccc;
}

.cw-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.cw-footer p {
  margin: 0;
  font-size: 11px;
  color: #bbb;
}

.cw-slide-enter-active, .cw-slide-leave-active {
  transition: all 0.3s ease;
}

.cw-slide-enter-from, .cw-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .cw-wrapper {
    bottom: 80px;
    right: 12px;
  }
  .cw-panel {
    width: 300px;
    right: 0;
  }
}
</style>
