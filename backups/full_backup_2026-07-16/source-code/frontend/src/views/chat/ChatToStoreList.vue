<template>
  <div>
    <h3>My Messages (to Stores)</h3>
    <div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No conversations</span></div>
    <div v-for="shop in list" :key="shop._id" class="chat-item g-flex-align-center" style="gap:12px;padding:12px;border:1px solid var(--g-border);border-radius:4px;margin-top:8px;cursor:pointer" @click="$router.push(`/chattostore?shopId=${shop._id}`)">
      <img :src="$imgUrl(shop.logo)" @error="$imgFallback" style="width:50px;height:50px;border-radius:50%;object-fit:cover" />
      <div><h4>{{ shop.name }}</h4></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
onMounted(async () => { const res = await get('/home/userKefu/getUserList'); if (res?.data) list.value = res.data })
</script>

<style scoped>
@media (max-width: 768px) {
  .chat-item { padding: 10px !important; gap: 10px !important; }
  .chat-item img { width: 40px !important; height: 40px !important; }
  .chat-item h4 { font-size: 14px; }
}
</style>
