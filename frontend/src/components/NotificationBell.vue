<template>
  <div class="ton-notif-wrapper" ref="wrapperRef">
    <button class="ton-header-icon ton-notif-bell" @click.stop="toggle" aria-label="Notifications">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
      <span class="ton-notif-badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
    <div class="ton-notif-panel" v-if="open">
      <div class="ton-notif-header">
        <span class="ton-notif-title">Notifications</span>
        <button class="ton-notif-mark-all" v-if="unreadCount > 0" @click="markAllRead">Mark all read</button>
      </div>
      <div class="ton-notif-list" v-if="notifications.length">
        <div v-for="n in notifications" :key="n._id" class="ton-notif-item" :class="{ unread: !n.isRead }" @click="handleClick(n)">
          <div class="ton-notif-item-top">
            <span class="ton-notif-item-type ton-notif-type-badge" :class="`ton-notif-type-${n.type}`">{{ n.type }}</span>
            <span class="ton-notif-item-time">{{ timeAgo(n.createdAt) }}</span>
          </div>
          <div class="ton-notif-item-title">{{ n.title }}</div>
          <div class="ton-notif-item-msg" v-if="n.message">{{ n.message }}</div>
        </div>
      </div>
      <div class="ton-notif-empty" v-else>
        <p>No notifications</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { get, put } from '@/api/request'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getSocket, joinUser } from '@/socket'

const router = useRouter()
const store = useAppStore()
const open = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const wrapperRef = ref(null)
let socket = null

const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }

const handleDocumentClick = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    close()
  }
}

const loadNotifications = async () => {
  const res = await get('/home/notification/list', { pageSize: 10 })
  if (res?.code === 0 && res?.data) {
    notifications.value = res.data.list || []
    unreadCount.value = res.data.unreadCount || 0
  }
}

const loadUnreadCount = async () => {
  const res = await get('/home/notification/unread-count')
  if (res?.code === 0 && res?.data) {
    unreadCount.value = res.data.count || 0
  }
}

const markAllRead = async () => {
  const res = await put('/home/notification/read-all')
  if (res?.code === 0) {
    notifications.value.forEach(n => { n.isRead = true })
    unreadCount.value = 0
  }
}

const handleClick = async (n) => {
  if (!n.isRead) {
    await put(`/home/notification/${n._id}/read`)
    n.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  if (n.link) router.push(n.link)
  close()
}

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

onMounted(() => {
  if (store.isLogin) {
    loadUnreadCount()
    if (store.userInfo?._id) {
      joinUser(store.userInfo._id)
    }
  }
  document.addEventListener('click', handleDocumentClick)
  try {
    socket = getSocket()
    if (socket) {
      socket.on('notification', (notif) => {
        notifications.value.unshift(notif)
        unreadCount.value++
      })
    }
  } catch {}
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (socket) socket.off('notification')
})
</script>

<style scoped>
.ton-notif-wrapper { position: relative; }
.ton-notif-bell { position: relative; }
.ton-notif-badge { position: absolute; top: 2px; right: 2px; background: #e74c3c; color: #fff; font-size: 9px; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; padding: 0 3px; }
.ton-notif-panel { position: absolute; top: 100%; right: 0; width: 360px; max-height: 480px; background: #fff; border: 1px solid #e8e6e2; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 1000; overflow: hidden; }
.ton-notif-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e8e6e2; }
.ton-notif-title { font-weight: 600; font-size: 14px; }
.ton-notif-mark-all { font-size: 12px; color: #3498db; background: none; border: none; cursor: pointer; }
.ton-notif-mark-all:hover { text-decoration: underline; }
.ton-notif-list { max-height: 400px; overflow-y: auto; }
.ton-notif-item { padding: 12px 16px; border-bottom: 1px solid #f4f2ee; cursor: pointer; transition: background 0.15s; }
.ton-notif-item:hover { background: #faf8f4; }
.ton-notif-item.unread { background: #fefefe; border-left: 3px solid #3498db; }
.ton-notif-item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.ton-notif-item-time { font-size: 11px; color: #999; }
.ton-notif-item-title { font-size: 13px; font-weight: 600; color: #333; }
.ton-notif-item-msg { font-size: 12px; color: #777; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ton-notif-type-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; }
.ton-notif-type-order { background: #e8f4fd; color: #2980b9; }
.ton-notif-type-payment { background: #e8f8e8; color: #27ae60; }
.ton-notif-type-shipping { background: #fef8e8; color: #f39c12; }
.ton-notif-type-refund { background: #fde8e8; color: #e74c3c; }
.ton-notif-type-system { background: #f0eef6; color: #8e44ad; }
.ton-notif-type-promotion { background: #fef0e8; color: #e67e22; }
.ton-notif-type-review { background: #e8f4fd; color: #2980b9; }
.ton-notif-type-message { background: #f0eef6; color: #8e44ad; }
.ton-notif-empty { padding: 40px 16px; text-align: center; color: #999; font-size: 13px; }
</style>