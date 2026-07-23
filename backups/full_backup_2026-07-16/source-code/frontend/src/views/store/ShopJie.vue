<template>
  <div class="shopjie-view">
    <div class="shopjie-container">
      <h2 class="shopjie-title">🛍️ Shop Street</h2>
      <div class="store-list">
        <div class="store-card g-flex-align-center" v-for="store in stores" :key="store._id" @click="$router.push(`/storedetail?id=${store._id}`)">
          <div class="store-logo"><img :src="$imgUrl(store.logo)" @error="$imgFallback" /></div>
          <div class="store-info">
            <h4>{{ store.name }}</h4>
            <p>{{ store.description }}</p>
            <div class="store-meta"><span>⭐ {{ store.rating || 5 }}</span><span>Products: {{ store.productCount || 0 }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="stores.length === 0" class="c-no-list"><span class="c-no-list-text">No stores yet</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const stores = ref([])
onMounted(async () => {
  const res = await get('/main/userShop/getList', { pageSize: 50 })
  if (res?.data) stores.value = res.data.list || []
})
</script>

<style scoped>
.shopjie-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.shopjie-container { max-width: var(--g-main-width); margin: 0 auto; }
.shopjie-title { font-size: 20px; margin-bottom: 16px; }
.store-list { display: flex; flex-direction: column; gap: 12px; }
.store-card { background: var(--g-white); border-radius: 8px; padding: 16px; cursor: pointer; gap: 16px; }
.store-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.store-logo { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.store-logo img { width: 100%; height: 100%; object-fit: cover; }
.store-info { flex: 1; }
.store-info h4 { font-size: 16px; margin-bottom: 4px; }
.store-info p { font-size: 13px; color: #666; }
.store-meta { display: flex; gap: 16px; font-size: 12px; color: #999; margin-top: 4px; }
@media (max-width: 768px) {
  .store-card { flex-direction: column; align-items: flex-start; padding: 12px; }
  .store-logo { width: 60px; height: 60px; }
  .store-info h4 { font-size: 15px; }
  .store-info p { font-size: 12px; }
}
</style>
