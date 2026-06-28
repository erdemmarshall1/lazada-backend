<template>
  <div>
    <h3>Internal Messages</h3>
    <div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No messages</span></div>
    <div v-for="msg in list" :key="msg._id" class="msg-item" style="padding:12px;border:1px solid var(--g-border);border-radius:4px;margin-top:8px">
      <div class="g-flex-align-center g-flex-justify-between">
        <strong>{{ msg.fromUserId?.username || 'System' }}</strong>
        <span style="font-size:12px;color:#999">{{ new Date(msg.createdAt).toLocaleDateString() }}</span>
      </div>
      <p style="margin-top:8px;font-size:14px">{{ msg.content }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
onMounted(async () => { const res = await get('/main/userMsg/getList', { pageSize: 50 }); if (res?.data) list.value = res.data.list || [] })
</script>

<style scoped>
@media (max-width: 768px) {
  .msg-item { padding: 10px !important; font-size: 13px; }
  .msg-item p { font-size: 13px; }
}
</style>
