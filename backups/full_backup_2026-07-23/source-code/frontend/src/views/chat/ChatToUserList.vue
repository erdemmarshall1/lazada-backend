<template>
  <div>
    <h3>Customer Messages</h3>
    <div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No customer messages</span></div>
    <div v-for="userId in list" :key="userId" class="chat-item" style="padding:12px;border:1px solid var(--g-border);border-radius:4px;margin-top:8px;cursor:pointer" @click="$router.push(`/chattouser?userId=${userId}`)">Customer: {{ userNames[userId] || userId }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api/request'
const list = ref([])
const router = useRouter()
const userNames = ref({})

onMounted(async () => {
  const res = await get('/home/userKefu/getShopList')
  if (res?.data) {
    const ids = Array.isArray(res.data) ? res.data : res.data.list || []
    list.value = ids
    const nameMap = {}
    for (const id of ids) {
      const userRes = await get('/home/user/getInfo', { userId: id })
      if (userRes?.data) nameMap[id] = userRes.data.username || 'User'
    }
    userNames.value = nameMap
  }
})
</script>

<style scoped>
@media (max-width: 768px) {
  .chat-item { padding: 10px !important; font-size: 13px; }
}
</style>
