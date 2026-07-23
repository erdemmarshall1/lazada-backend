<template>
  <div class="chat-view">
    <h3>Chat with Customer</h3>
    <div class="chat-box" ref="chatBox">
      <div v-for="msg in messages" :key="msg._id" class="chat-msg" :class="{ mine: msg.fromUserId === store.userInfo?._id }">
        <div class="msg-content">{{ msg.content }}</div>
        <div class="msg-time">{{ msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '' }}</div>
      </div>
    </div>
    <div class="chat-input g-flex-align-center" style="gap:8px;margin-top:12px">
      <el-input v-model="text" placeholder="Type a message..." @keyup.enter="sendMsg" />
      <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="sendMsg">Send</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'
import { getSocket, markRead } from '@/socket'

const route = useRoute()
const store = useAppStore()
const messages = ref([]); const text = ref(''); const chatBox = ref(null)

const loadMessages = async () => {
  const res = await get('/home/userKefu/getMsgList', { toUserId: route.query.userId })
  if (res?.data) { messages.value = res.data; nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight }) }
}

const sendMsg = async () => {
  if (!text.value.trim()) return
  await qe(post('/home/userKefu/sendShopMsg', { content: text.value, toUserId: route.query.userId }))
  text.value = ''; loadMessages()
}

const handleNewMessage = (msg) => {
  if (msg.fromUserId === route.query.userId || msg.toUserId === route.query.userId) {
    messages.value.push(msg)
    nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
  }
}

onMounted(() => {
  if (!route.query.userId) return ElMessage.error('Missing user ID')
  loadMessages()
  markRead({ sessionId: `user_${route.query.userId}`, userId: store.userInfo?._id })
  const socket = getSocket()
  if (socket) {
    socket.on('newMessage', handleNewMessage)
  }
})

onUnmounted(() => {
  const socket = getSocket()
  if (socket) {
    socket.off('newMessage', handleNewMessage)
  }
})
</script>

<style scoped>
.chat-view { display: flex; flex-direction: column; height: 500px; }
.chat-box { flex: 1; overflow-y: auto; padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; margin-top: 12px; }
.chat-msg { margin-bottom: 12px; max-width: 70%; }
.chat-msg.mine { margin-left: auto; text-align: right; }
.msg-content { display: inline-block; padding: 8px 12px; border-radius: 8px; background: #f0f0f0; font-size: 14px; }
.chat-msg.mine .msg-content { background: var(--g-main_color); color: #fff; }
.msg-time { font-size: 11px; color: #999; margin-top: 4px; }
@media (max-width: 768px) {
  .chat-view { height: calc(100vh - 200px); }
  .chat-msg { max-width: 85%; }
  .chat-input { flex-wrap: wrap; }
  .chat-input .el-button { width: 100%; }
}
</style>
