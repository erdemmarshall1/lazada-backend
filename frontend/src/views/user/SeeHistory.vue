<template>
  <div><h3>Browsing History</h3><div class="product-grid" v-loading="loading"><div class="product-card" v-for="item in list" :key="item._id" @click="item.productId?._id && $router.push(`/gooddetail?id=${item.productId?._id}`)"><div class="product-img"><img :src="$imgUrl(item.productId?.images?.[0])" loading="lazy" @error="$imgFallback" /></div><div class="product-info"><h4 class="g-text-ellipsis">{{ item.productId?.name }}</h4><div class="product-price">${{ item.productId?.minPrice }}</div></div></div></div><div v-if="list.length===0" class="c-no-list"><span class="c-no-list-text">No history</span></div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
const list = ref([])
const loading = ref(true)
onMounted(async () => { const res = await get('/home/userCollect/getBrowseList', { pageSize: 20 }); if (res?.data) list.value = res.data.list || []; loading.value = false })
</script>
<style scoped>
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
.product-card { border: 1px solid var(--g-border); border-radius: 8px; overflow: hidden; cursor: pointer; }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.product-info { padding: 8px; }
.product-price { color: var(--g-main_color); font-weight: 600; margin-top: 4px; }
@media (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
@media (max-width: 480px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
}
</style>
