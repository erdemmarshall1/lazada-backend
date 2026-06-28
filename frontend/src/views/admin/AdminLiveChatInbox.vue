<template>
  <div class="admin-live-chat-inbox">
    <h2>Live Chat Inbox</h2>
    <p class="desc">Reply to live chat messages from users. Real-time updates via WebSocket.</p>

    <div v-if="!agentOnline" class="lc-status-banner">
      <el-tag type="warning">You are offline. Click to go online as a support agent.</el-tag>
    </div>
    <div v-else class="lc-status-banner">
      <el-tag type="success">You are online and receiving live chat messages.</el-tag>
    </div>

    <div v-loading="loading" class="inbox-layout">
      <div class="inbox-sidebar">
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
.admin-live-chat-inbox .desc { color: #999; font-size: 13px; margin-bottom: 12px; }
.lc-status-banner { margin-bottom: 12px; }

.inbox-layout { flex: 1; display: flex; gap: 0; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; min-height: 0; }

.inbox-sidebar { width: 280px; border-right: 1px solid #e8e8e8; overflow-y: auto; background: #fafafa; }
.inbox-empty { padding: 40px 20px; text-align: center; color: #999; }

.inbox-conv { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f0f0f0; }
.inbox-conv:hover { background: #f0f0f0; }
.inbox-conv.active { background: #e6f0ff; }

.inbox-conv-avatar { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.inbox-avatar-img { width: 100%; height: 100%; object-fit: cover; }

.inbox-conv-info { flex: 1; min-width: 0; }
.inbox-conv-name { font-size: 14px; font-weight: 600; color: #333; }
.inbox-conv-preview { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.inbox-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.inbox-chat-header { padding: 12px 16px; border-bottom: 1px solid #e8e8e8; background: #fff; }
.inbox-chat-header strong { font-size: 15px; }
.inbox-chat-id { margin-left: 12px; font-size: 12px; color: #999; }

.inbox-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.inbox-loading-msg { text-align: center; color: #999; padding: 20px; }

.inbox-msg { max-width: 75%; }
.inbox-msg-user { align-self: flex-start; }
.inbox-msg-admin { align-self: flex-end; }
.inbox-msg-content { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-break: break-word; }
.inbox-msg-user .inbox-msg-content { background: #f0f0f0; color: #333; border-bottom-left-radius: 4px; }
.inbox-msg-admin .inbox-msg-content { background: var(--g-main_color); color: #fff; border-bottom-right-radius: 4px; }
.inbox-msg-time { font-size: 11px; color: #bbb; margin-top: 2px; }

.inbox-chat-footer { display: flex; padding: 12px 16px; border-top: 1px solid #e8e8e8; background: #fff; gap: 8px; }
.inbox-input { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; font-size: 14px; outline: none; }
.inbox-input:focus { border-color: var(--g-main_color); }
.inbox-send-btn { padding: 8px 20px; border: none; border-radius: 6px; background: var(--g-main_color); color: #fff; cursor: pointer; font-size: 14px; font-weight: 600; }
.inbox-send-btn:disabled { opacity: 0.5; cursor: default; }

.inbox-no-selection { flex: 1; display: flex; align-items: center; justify-content: center; color: #999; font-size: 15px; }
</style>
