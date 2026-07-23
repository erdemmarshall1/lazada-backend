<template>
  <div>
    <h3>My Consultations</h3>
    <p style="color:var(--g-text-light);margin-bottom:16px;font-size:13px">Product inquiries and buyer consultations about your store</p>

    <div v-if="loading" v-loading="loading" style="height:200px"></div>

    <div v-else-if="consultations.length === 0" class="c-no-list">
      <span class="c-no-list-text">No consultations yet</span>
    </div>

    <div v-else class="consultation-list">
      <div
        v-for="item in consultations"
        :key="item._id || item.sessionId"
        class="consultation-item"
        @click="openChat(item)"
      >
        <div class="consultation-avatar">
          <img v-if="item.userAvatar" :src="$imgUrl(item.userAvatar)" @error="$imgFallback" />
          <div v-else class="avatar-placeholder">{{ (item.username || 'U').charAt(0).toUpperCase() }}</div>
        </div>
        <div class="consultation-body">
          <div class="consultation-header">
            <span class="consultation-name">{{ item.username || 'Buyer' }}</span>
            <span class="consultation-time">{{ formatTime(item.updatedAt || item.lastMessageTime) }}</span>
          </div>
          <div class="consultation-preview">{{ item.lastMessage || item.preview || 'No messages yet' }}</div>
          <div class="consultation-product" v-if="item.productName">
            <i class="iconfont icon-shangpin"></i> {{ item.productName }}
          </div>
        </div>
        <div class="consultation-badge" v-if="item.unreadCount > 0">
          {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api/request'

const router = useRouter()
const loading = ref(true)
const consultations = ref([])

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago'
  return d.toLocaleDateString()
}

const loadConsultations = async () => {
  loading.value = true
  try {
    const res = await get('/home/kefu/getShopList')
    if (res?.data) {
      consultations.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch {
    consultations.value = []
  } finally {
    loading.value = false
  }
}

const openChat = (item) => {
  const sessionId = item.sessionId || item._id
  router.push({ name: 'chattouser', query: { sessionId } })
}

onMounted(loadConsultations)
</script>

<style scoped>
.consultation-list {
  display: flex;
  flex-direction: column;
}

.consultation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid var(--g-border);
  cursor: pointer;
  transition: background 0.2s;
}

.consultation-item:hover {
  background: var(--g-off-white);
}

.consultation-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.consultation-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--g-main_color), #ff8c38);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.consultation-body {
  flex: 1;
  min-width: 0;
}

.consultation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.consultation-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--g-text);
}

.consultation-time {
  font-size: 12px;
  color: var(--g-text-light);
  flex-shrink: 0;
}

.consultation-preview {
  font-size: 13px;
  color: var(--g-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.consultation-product {
  font-size: 12px;
  color: var(--g-main_color);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.consultation-product .iconfont {
  font-size: 12px;
}

.consultation-badge {
  background: var(--g-main_color);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .consultation-item {
    padding: 12px 8px;
  }

  .consultation-avatar {
    width: 38px;
    height: 38px;
  }
}
</style>
