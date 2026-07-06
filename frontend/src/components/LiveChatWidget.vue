<template>
  <div class="live-chat-widget">
    <!-- Floating button -->
    <div class="lcw-button" @click="open = !open" :class="{ pulse: !open }">
      <svg v-if="!open" width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </div>

    <!-- Chat panel -->
    <transition name="lcw-slide">
      <div v-if="open" class="lcw-panel">
        <div class="lcw-header">
          <h4>Need help?</h4>
          <p>Our support team is ready to assist you</p>
        </div>
        <div class="lcw-body">
          <!-- WhatsApp -->
          <a :href="whatsappUrl" target="_blank" rel="noopener" class="lcw-option lcw-whatsapp" @click="trackClick('whatsapp')">
            <div class="lcw-option-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div class="lcw-option-text">
              <strong>WhatsApp</strong>
              <span>Chat with us on WhatsApp</span>
            </div>
            <span class="lcw-option-arrow">&rarr;</span>
          </a>

          <!-- Telegram -->
          <a :href="telegramUrl" target="_blank" rel="noopener" class="lcw-option lcw-telegram" @click="trackClick('telegram')">
            <div class="lcw-option-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#0088cc"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </div>
            <div class="lcw-option-text">
              <strong>Telegram</strong>
              <span>Message us on Telegram</span>
            </div>
            <span class="lcw-option-arrow">&rarr;</span>
          </a>

          <!-- In-App Chat (if logged in) -->
          <div v-if="store.isLogin" class="lcw-option lcw-inapp" @click="openInAppChat">
            <div class="lcw-option-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--g-main_color)"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg>
            </div>
            <div class="lcw-option-text">
              <strong>In-App Chat</strong>
              <span>Send us a message</span>
            </div>
            <span class="lcw-option-arrow">&rarr;</span>
          </div>
        </div>
        <div class="lcw-footer">
          <p>Typically replies within 1 hour</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const open = ref(false)
const router = useRouter()
const store = useAppStore()

const PHONE_NUMBER = '14155238886' // WhatsApp number
const TELEGRAM_USERNAME = 'theoutnet_support' // Telegram username

const whatsappUrl = computed(() => `https://wa.me/${PHONE_NUMBER}?text=Hello%20THE%20OUTNET%20support%2C%20I%20need%20help`)
const telegramUrl = computed(() => `https://t.me/${TELEGRAM_USERNAME}`)

const trackClick = (channel) => {
  console.log(`Live chat clicked: ${channel}`)
}

const openInAppChat = () => {
  open.value = false
  router.push('/chattostorelist')
}
</script>

<style scoped>
.live-chat-widget {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.lcw-button {
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
}

.lcw-button:hover {
  transform: scale(1.1);
}

.lcw-button.pulse {
  animation: lcw-pulse 2s infinite;
}

@keyframes lcw-pulse {
  0% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 4px 30px rgba(255, 140, 56, 0.4); }
  100% { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
}

.lcw-panel {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  overflow: hidden;
}

.lcw-header {
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff;
  padding: 24px 20px 20px;
}

.lcw-header h4 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.lcw-header p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.lcw-body {
  padding: 12px;
}

.lcw-option {
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

.lcw-option:hover {
  background: #f5f5f5;
}

.lcw-option-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 12px;
}

.lcw-option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lcw-option-text strong {
  font-size: 14px;
  font-weight: 600;
}

.lcw-option-text span {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.lcw-option-arrow {
  font-size: 20px;
  color: #ccc;
}

.lcw-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.lcw-footer p {
  margin: 0;
  font-size: 11px;
  color: #bbb;
}

.lcw-slide-enter-active, .lcw-slide-leave-active {
  transition: all 0.3s ease;
}

.lcw-slide-enter-from, .lcw-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .live-chat-widget {
    bottom: 80px;
    right: 12px;
  }
  .lcw-panel {
    width: 300px;
    right: 0;
  }
}
</style>

