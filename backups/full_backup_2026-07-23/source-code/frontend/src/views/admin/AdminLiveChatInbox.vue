<template>
  <div class="admin-page admin-live-chat-inbox">
    <h2>Live Chat Inbox</h2>
    <p class="desc">Reply to live chat messages from users. Real-time updates via WebSocket.</p>

    <div v-if="!agentOnline" class="lc-status-banner">
      <el-tag type="warning">You are offline. Click to go online as a support agent.</el-tag>
    </div>
    <div v-else class="lc-status-banner">
      <el-tag type="success">You are online and receiving live chat messages.</el-tag>
    </div>

    <div v-loading="loading" class="inbox-layout">
      <button class="inbox-mobile-toggle" @click="showSidebar = !showSidebar" :class="{ active: showSidebar }">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <span>Conversations</span>
      </button>
      <div :class="['inbox-sidebar', { open: showSidebar }]">
        <div v-if="conversations.length === 0 && !loading" class="inbox-empty">No conversations yet.</div>
        <div v-for="conv in conversations" :key="conv.userId" :class="['inbox-conv', { active: activeUserId === conv.userId }]" @click="selectConversation(conv.userId)">
          <div class="inbox-conv-avatar">
            <svg v-if="!conv.user?.avatar" viewBox="0 0 24 24" width="36" height="36" fill="#bbb">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <img v-else :src="conv.user.avatar" class="inbox-avatar-img" />
          </div>
          <div class="inbox-conv-info">
            <div class="inbox-conv-name">{{ conv.user?.username || 'Unknown User' }}</div>
            <div class="inbox-conv-preview">{{ conv.lastMessage?.content?.substring(0, 40) || '' }}</div>
          </div>
        </div>
      </div>

      <div class="inbox-main">
        <template v-if="activeUserId">
          <div class="inbox-chat-header">
            <strong>{{ activeUser?.username || 'User' }}</strong>
            <span class="inbox-chat-id">ID: {{ activeUserId }}</span>
          </div>

          <div class="inbox-messages" ref="msgRef">
            <div v-for="msg in chatMessages" :key="msg._id" :class="['inbox-msg', msg.fromUserId === store.userInfo?._id ? 'inbox-msg-admin' : 'inbox-msg-user']">
              <div class="inbox-msg-content">{{ msg.content }}</div>
              <div class="inbox-msg-time">{{ formatTime(msg.createdAt) }}</div>
            </div>
            <div v-if="loadingMsg" class="inbox-loading-msg">Loading messages...</div>
          </div>

          <div class="inbox-chat-footer">
            <input v-model="replyText" class="inbox-input" placeholder="Type your reply..." @keyup.enter="sendReply" :disabled="replying" />
            <button class="inbox-send-btn" @click="sendReply" :disabled="replying || !replyText.trim()">Send</button>
          </div>
        </template>

        <div v-else class="inbox-no-selection">Select a conversation from the sidebar.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, $http } from '@/api/request'
import { getSocket } from '@/socket'

const store = useAppStore()
const socket = getSocket()

const loading = ref(false)
const showSidebar = ref(false)
const conversations = ref([])
const activeUserId = ref(null)
const activeUser = ref(null)
const chatMessages = ref([])
const loadingMsg = ref(false)
const replyText = ref('')
const replying = ref(false)
const agentOnline = ref(false)
const msgRef = ref(null)

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleString()
}

const loadConversations = async () => {
  loading.value = true
  try {
    const res = await get('/home/userKefu/admin/conversations')
    if (res?.code === 0 && res?.data) {
      conversations.value = res.data.conversations || []
      agentOnline.value = res.data.agentOnline || false
    }
  } catch (e) {}
  loading.value = false
}

const selectConversation = async (userId) => {
  showSidebar.value = false
  activeUserId.value = userId
  activeUser.value = null
  for (const c of conversations.value) {
    if (c.userId === userId) {
      activeUser.value = c.user
      break
    }
  }
  loadingMsg.value = true
  try {
    const res = await get('/home/userKefu/admin/messages', { params: { userId } })
    if (res?.code === 0 && Array.isArray(res.data)) {
      chatMessages.value = res.data
    }
  } catch (e) {}
  loadingMsg.value = false
  setTimeout(() => {
    if (msgRef.value) msgRef.value.scrollTop = msgRef.value.scrollHeight
  }, 100)
}

const sendReply = async () => {
  const text = replyText.value.trim()
  if (!text || replying.value || !activeUserId.value) return
  replying.value = true
  replyText.value = ''
  try {
    const res = await $http.post('/home/userKefu/admin/sendReply', { toUserId: activeUserId.value, content: text })
    if (res?.code === 0 && res?.data) {
      chatMessages.value.push(res.data)
    }
  } catch (e) {}
  replying.value = false
  setTimeout(() => {
    if (msgRef.value) msgRef.value.scrollTop = msgRef.value.scrollHeight
  }, 100)
}

const handleKefuMessage = (msg) => {
  const fromId = msg.fromUserId?._id || msg.fromUserId
  if (activeUserId.value && fromId === activeUserId.value) {
    const exists = chatMessages.value.some(m => m._id === msg._id)
    if (!exists) {
      chatMessages.value.push(msg)
      setTimeout(() => {
        if (msgRef.value) msgRef.value.scrollTop = msgRef.value.scrollHeight
      }, 100)
    }
  }
  loadConversations()
}

const handleAgentStatusChange = (data) => {
  // no-op for now
}

onMounted(() => {
  loadConversations()
  if (socket) {
    socket.on('kefuMessage', handleKefuMessage)
    socket.on('agentStatusChange', handleAgentStatusChange)
  }
})

onUnmounted(() => {
  if (socket) {
    socket.off('kefuMessage', handleKefuMessage)
    socket.off('agentStatusChange', handleAgentStatusChange)
  }
})
</script>

<style scoped>
.admin-live-chat-inbox { padding: 20px; height: calc(100vh - 120px); display: flex; flex-direction: column; }
.admin-live-chat-inbox h2 { margin-bottom: 4px; }
.admin-live-chat-inbox .desc { font-size: 13px; margin-bottom: 12px; color: rgba(255,255,255,0.5); }
.lc-status-banner { margin-bottom: 12px; }

.inbox-mobile-toggle { display: none; align-items: center; gap: 8px; padding: 10px 16px; background: var(--dash-dark-card-alt); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 14px; margin-bottom: 8px; width: 100%; transition: background 0.2s; }
.inbox-mobile-toggle:hover { background: rgba(255,255,255,0.06); }
.inbox-mobile-toggle.active { background: rgba(102,126,234,0.12); color: #667eea; border-color: #667eea; }

.inbox-layout { flex: 1; display: flex; gap: 0; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden; min-height: 0; background: var(--dash-dark-card); }

.inbox-sidebar { width: 280px; border-right: 1px solid rgba(255,255,255,0.06); overflow-y: auto; background: var(--dash-dark-bg); flex-shrink: 0; }
.inbox-empty { padding: 40px 20px; text-align: center; color: rgba(255,255,255,0.3); }

.inbox-conv { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.04); }
.inbox-conv:hover { background: rgba(255,255,255,0.04); }
.inbox-conv.active { background: rgba(102,126,234,0.12); }

.inbox-conv-avatar { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); }
.inbox-avatar-img { width: 100%; height: 100%; object-fit: cover; }

.inbox-conv-info { flex: 1; min-width: 0; }
.inbox-conv-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
.inbox-conv-preview { font-size: 12px; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.inbox-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.inbox-chat-header { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); background: var(--dash-dark-card); }
.inbox-chat-header strong { font-size: 15px; color: rgba(255,255,255,0.85); }
.inbox-chat-id { margin-left: 12px; font-size: 12px; color: rgba(255,255,255,0.4); }

.inbox-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: var(--dash-dark-card); }
.inbox-loading-msg { text-align: center; color: rgba(255,255,255,0.3); padding: 20px; }

.inbox-msg { max-width: 75%; }
.inbox-msg-user { align-self: flex-start; }
.inbox-msg-admin { align-self: flex-end; }
.inbox-msg-content { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-break: break-word; }
.inbox-msg-user .inbox-msg-content { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); border-bottom-left-radius: 4px; }
.inbox-msg-admin .inbox-msg-content { background: #667eea; color: #fff; border-bottom-right-radius: 4px; }
.inbox-msg-time { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }

.inbox-chat-footer { display: flex; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); background: var(--dash-dark-card); gap: 8px; }
.inbox-input { flex: 1; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px 12px; font-size: 14px; outline: none; background: var(--dash-dark-card-alt); color: rgba(255,255,255,0.85); }
.inbox-input:focus { border-color: #667eea; }
.inbox-input::placeholder { color: rgba(255,255,255,0.3); }
.inbox-send-btn { padding: 8px 20px; border: none; border-radius: 6px; background: #667eea; color: #fff; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; }
.inbox-send-btn:hover { background: #7c93f5; }
.inbox-send-btn:disabled { opacity: 0.4; cursor: default; }

.inbox-no-selection { flex: 1; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 15px; }

@media (max-width: 768px) {
  .admin-live-chat-inbox { padding: 12px; height: calc(100vh - 80px); }
  .inbox-mobile-toggle { display: flex; }
  .inbox-sidebar { position: fixed; top: 0; left: -100%; width: 85%; max-width: 320px; height: 100%; z-index: 1000; transition: left 0.25s ease; box-shadow: 4px 0 20px rgba(0,0,0,0.4); }
  .inbox-sidebar.open { left: 0; }
  .inbox-sidebar.open::before { content: ''; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: -1; }
  .inbox-msg { max-width: 90%; }
}
@media (max-width: 480px) {
  .admin-live-chat-inbox { padding: 8px; }
  .inbox-conv { padding: 10px 12px; }
  .inbox-chat-header { padding: 10px 12px; }
  .inbox-chat-footer { padding: 10px 12px; }
  .inbox-messages { padding: 10px; }
  .inbox-input { font-size: 13px; }
  .inbox-send-btn { padding: 8px 14px; font-size: 13px; }
}
</style>
