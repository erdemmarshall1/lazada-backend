<template>
  <div class="list-view">
    <div class="list-container">
      <h2 class="list-title">🔥 Hot Products</h2>
      <div class="product-grid">
        <div class="product-card" v-for="item in list" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="product-info">
            <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-price"><span class="price-current">${{ item.minPrice }}</span></div>
            <div class="product-meta"><span>Sold {{ item.salesCount || 0 }}</span><span>⭐ {{ item.rating || 5 }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0" class="c-no-list"><span class="c-no-list-text">No products</span></div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const list = ref([])
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

onMounted(async () => {
  const res = await get('/main/goods/getHotList')
  if (res?.data) list.value = Array.isArray(res.data) ? res.data : res.data.list || []
})
</script>

<style scoped>
.list-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.list-container { max-width: var(--g-main-width); margin: 0 auto; }
.list-title { font-size: 20px; margin-bottom: 16px; }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-name { font-size: 13px; margin-bottom: 6px; }
.price-current { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
.product-meta { display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-top: 4px; }
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
