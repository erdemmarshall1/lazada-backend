<template>
  <div v-if="config.enabled" :class="['live-chat-widget', config.widgetPosition || 'bottom-right']">
    <div v-if="!open" class="lc-bubble" @click="openPanel">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <span v-if="unreadCount > 0" class="lc-badge">{{ unreadCount }}</span>
    </div>

    <transition name="lc-slide">
      <div v-if="open" class="lc-panel" ref="panelRef">
        <div class="lc-header" :style="{ background: config.widgetColor }">
          <span>{{ config.widgetTitle || 'Live Chat' }}</span>
          <button class="lc-close" @click="closePanel">&times;</button>
        </div>

        <div class="lc-body" ref="bodyRef">
          <template v-if="!store.isLogin">
            <div class="lc-login-prompt">
              <p>Please log in to use live chat.</p>
              <button class="lc-btn" @click="goLogin">Log In</button>
            </div>
          </template>

          <template v-else-if="loading">
            <div class="lc-loading">Loading...</div>
          </template>

          <template v-else>
            <div class="lc-greeting" v-if="messages.length === 0">
              <div class="lc-agent-avatar">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="var(--g-main_color)">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p class="lc-greeting-text">{{ config.autoGreeting }}</p>
              <p v-if="agentsOnline > 0" class="lc-status online">{{ agentsOnline }} agent(s) online</p>
              <p v-else class="lc-status offline">{{ config.offlineMessage }}</p>
            </div>

            <div class="lc-messages" v-if="messages.length > 0">
              <div v-for="msg in messages" :key="msg._id" :class="['lc-msg', msg.fromUserId === userId ? 'lc-msg-user' : 'lc-msg-agent']">
                <div class="lc-msg-content">{{ msg.content }}</div>
                <div class="lc-msg-time">{{ formatTime(msg.createdAt) }}</div>
              </div>
            </div>

            <div v-if="agentTyping" class="lc-typing">Agent is typing...</div>
          </template>
        </div>

        <div class="lc-footer" v-if="store.isLogin">
          <input v-model="inputText" class="lc-input" placeholder="Type a message..." @keyup.enter="sendMsg" :disabled="sending" />
          <button class="lc-send-btn" :style="{ background: config.widgetColor }" @click="sendMsg" :disabled="sending || !inputText.trim()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, $http } from '@/api/request'
import { getSocket } from '@/socket'
import { useRouter } from 'vue-router'

const store = useAppStore()
const router = useRouter()
const userId = computed(() => store.userInfo?._id)
const open = ref(false)
const loading = ref(false)
const sending = ref(false)
const inputText = ref('')
const messages = ref([])
const config = reactive({ enabled: false, widgetTitle: 'Live Chat', widgetColor: '#165dff', widgetPosition: 'bottom-right', autoGreeting: '', offlineMessage: '' })
const agentsOnline = ref(0)
const agentTyping = ref(false)
const unreadCount = ref(0)
const panelRef = ref(null)
const bodyRef = ref(null)

const scrollBottom = async () => {
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const openPanel = async () => {
  open.value = true
  unreadCount.value = 0
  if (!store.isLogin) return
  loading.value = true
  try {
    const res = await get('/home/userKefu/getKefuHistory')
    if (res?.code === 0 && Array.isArray(res.data)) {
      messages.value = res.data
    }
  } catch (e) {}
  loading.value = false
  await scrollBottom()
}

const closePanel = () => {
  open.value = false
}

const sendMsg = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value || !store.isLogin) return
  sending.value = true
  inputText.value = ''
  const tempId = 'temp_' + Date.now()
  messages.value.push({ _id: tempId, content: text, fromUserId: userId.value, createdAt: new Date().toISOString() })
  await scrollBottom()
  try {
    const res = await $http.post('/home/userKefu/sendKefuMsg', { content: text })
    if (res?.code === 0 && res?.data) {
      const idx = messages.value.findIndex(m => m._id === tempId)
      if (idx !== -1) messages.value[idx] = res.data
    }
  } catch (e) {}
  sending.value = false
}

const goLogin = () => {
  closePanel()
  router.push({ name: 'login' })
}

const loadConfig = async () => {
  try {
    const res = await get('/home/userKefu/live-chat-config')
    if (res?.code === 0 && res?.data) {
      config.enabled = res.data.enabled
      config.widgetTitle = res.data.widgetTitle || 'Live Chat'
      config.widgetColor = res.data.widgetColor || '#165dff'
      config.widgetPosition = res.data.widgetPosition || 'bottom-right'
      config.autoGreeting = res.data.autoGreeting || ''
      config.offlineMessage = res.data.offlineMessage || ''
    }
  } catch (e) {}
}

const handleAgentReply = (msg) => {
  if (!open.value) {
    unreadCount.value++
    return
  }
  const exists = messages.value.some(m => m._id === msg._id)
  if (!exists) {
    messages.value.push(msg)
    scrollBottom()
  }
  agentTyping.value = false
}

const handleKefuMessage = (msg) => {
  if (msg.fromUserId?._id === userId.value) {
    const exists = messages.value.some(m => m._id === msg._id)
    if (!exists) {
      messages.value.push(msg)
      scrollBottom()
    }
  }
}

const handleAgentTyping = () => {
  agentTyping.value = true
  setTimeout(() => { agentTyping.value = false }, 3000)
}

onMounted(loadConfig)

onUnmounted(() => {})

const socket = getSocket()
if (socket) {
  socket.on('agentReply', handleAgentReply)
  socket.on('kefuMessage', handleKefuMessage)
  socket.on('agentTyping', handleAgentTyping)
}
</script>

<style scoped>
.live-chat-widget { position: fixed; z-index: 9999; font-family: inherit; }
.live-chat-widget.bottom-right { right: 20px; bottom: 20px; }
.live-chat-widget.bottom-left { left: 20px; bottom: 20px; }

.lc-bubble { width: 56px; height: 56px; border-radius: 50%; background: var(--g-main_color); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: transform 0.2s; position: relative; }
.lc-bubble:hover { transform: scale(1.1); }
.lc-badge { position: absolute; top: -4px; right: -4px; background: #f56c6c; color: #fff; border-radius: 50%; min-width: 20px; height: 20px; font-size: 12px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

.lc-panel { position: fixed; bottom: 20px; right: 20px; width: 340px; height: 480px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; }
.live-chat-widget.bottom-left .lc-panel { right: auto; left: 20px; }

.lc-header { padding: 14px 16px; color: #fff; font-weight: 600; font-size: 15px; display: flex; justify-content: space-between; align-items: center; }
.lc-close { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 0; line-height: 1; }

.lc-body { flex: 1; overflow-y: auto; padding: 16px; }

.lc-login-prompt { text-align: center; padding: 60px 20px; }
.lc-login-prompt p { color: #999; margin-bottom: 16px; }
.lc-btn { padding: 8px 24px; border: none; border-radius: 6px; background: var(--g-main_color); color: #fff; cursor: pointer; font-size: 14px; }
.lc-loading { text-align: center; padding: 60px 20px; color: #999; }

.lc-greeting { text-align: center; padding: 30px 16px; }
.lc-agent-avatar { margin-bottom: 12px; }
.lc-greeting-text { color: #333; font-size: 14px; margin-bottom: 8px; line-height: 1.5; }
.lc-status { font-size: 12px; }
.lc-status.online { color: #67c23a; }
.lc-status.offline { color: #e6a23c; }

.lc-messages { display: flex; flex-direction: column; gap: 8px; }
.lc-msg { max-width: 80%; }
.lc-msg-agent { align-self: flex-start; }
.lc-msg-user { align-self: flex-end; }
.lc-msg-content { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-break: break-word; }
.lc-msg-agent .lc-msg-content { background: #f0f0f0; color: #333; border-bottom-left-radius: 4px; }
.lc-msg-user .lc-msg-content { background: var(--g-main_color); color: #fff; border-bottom-right-radius: 4px; }
.lc-msg-time { font-size: 11px; color: #bbb; margin-top: 2px; padding: 0 4px; }

.lc-typing { padding: 8px 16px; font-size: 12px; color: #999; font-style: italic; }

.lc-footer { display: flex; padding: 10px 12px; border-top: 1px solid #eee; gap: 8px; background: #fafafa; }
.lc-input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 8px 14px; font-size: 14px; outline: none; }
.lc-input:focus { border-color: var(--g-main_color); }
.lc-send-btn { width: 36px; height: 36px; border: none; border-radius: 50%; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lc-send-btn:disabled { opacity: 0.5; cursor: default; }

.lc-slide-enter-active, .lc-slide-leave-active { transition: all 0.3s ease; }
.lc-slide-enter-from, .lc-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@media (max-width: 480px) {
  .lc-panel { width: 100vw; height: 100vh; bottom: 0 !important; right: 0 !important; left: 0 !important; border-radius: 0; }
}
</style>
