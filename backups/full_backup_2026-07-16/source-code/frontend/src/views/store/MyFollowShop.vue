<template>
  <div>
    <h3>Followed Stores</h3>
    <div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No followed stores</span></div>
    <div class="store-item g-flex-align-center" v-for="store in list" :key="store._id" style="gap:16px;padding:12px;border:1px solid var(--g-border);border-radius:4px;margin-top:8px;cursor:pointer" @click="$router.push(`/storedetail?id=${store._id}`)">
      <img :src="$imgUrl(store.logo)" @error="$imgFallback" style="width:60px;height:60px;border-radius:4px;object-fit:cover" />
      <div><h4>{{ store.name }}</h4><p style="font-size:13px;color:#666">⭐ {{ store.rating || 5 }}</p></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
onMounted(async () => { const res = await get('/home/userCollect/getShopList'); if (res?.data) list.value = res.data.list || [] })
</script>

<style scoped>
@media (max-width: 768px) {
  .store-item { flex-wrap: wrap; gap: 12px !important; }
  .store-item > div { flex: 1; min-width: 0; }
}
</style>
