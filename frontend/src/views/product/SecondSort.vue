<template>
  <div class="sort-view">
    <div class="sort-container">
      <h2 class="sort-title">Categories</h2>
      <div class="sort-content g-flex">
        <div class="sort-sidebar">
          <div class="sort-cat" v-for="cat in categories" :key="cat._id" :class="{ active: selectedCat === cat._id }" @click="selectCat(cat._id)">{{ cat.name }}</div>
        </div>
        <div class="sort-main">
          <div class="sub-cats g-flex-wrap" v-if="subCategories.length > 0">
            <div class="sub-cat" v-for="sub in subCategories" :key="sub._id" @click="searchSub(sub._id)">{{ sub.name }}</div>
          </div>
          <div class="product-grid">
            <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
              <div class="product-img">
                <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
                <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
              </div>
              <div class="product-info">
                <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
                <div class="product-price"><span class="price-current">${{ item.minPrice }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, qe } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const route = useRoute()
const router = useRouter()
const categories = ref([])
const selectedCat = ref('')
const products = ref([])
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const subCategories = computed(() => {
  if (!selectedCat.value) return []
  return categories.value.filter(c => c.parentId === selectedCat.value || (c.level === 2 && c.parentId?.toString() === selectedCat.value))
})

const selectCat = (id) => {
  selectedCat.value = id
  loadProducts(id)
}

const searchSub = (id) => {
  router.push(`/searchgoods?categoryId=${id}`)
}

const loadProducts = async (catId) => {
  const res = await get('/main/goods/getSearchList', { categoryId: catId, pageSize: 20 })
  if (res?.data) products.value = res.data.list || []
}

onMounted(async () => {
  const res = await get('/main/goodsCategory/getList')
  if (res?.data) {
    categories.value = res.data
    const topCat = res.data.find(c => c.level === 1)
    if (topCat) {
      selectedCat.value = topCat._id
      loadProducts(topCat._id)
    }
    if (route.query.categoryId) {
      selectCat(route.query.categoryId)
    }
  }
})
</script>

<style scoped>
.sort-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.sort-container { max-width: var(--g-main-width); margin: 0 auto; }
.sort-title { font-size: 20px; margin-bottom: 16px; }
.sort-content { gap: 16px; }
.sort-sidebar { width: 200px; background: var(--g-white); border-radius: 8px; padding: 8px 0; flex-shrink: 0; }
.sort-cat { padding: 10px 20px; cursor: pointer; font-size: 14px; }
.sort-cat:hover { color: var(--g-main_color); }
.sort-cat.active { color: var(--g-main_color); font-weight: 600; background: #fff5e6; }
.sort-main { flex: 1; }
.sub-cats { gap: 8px; margin-bottom: 16px; }
.sub-cat { padding: 6px 16px; background: var(--g-white); border-radius: 4px; cursor: pointer; font-size: 13px; border: 1px solid var(--g-border); }
.sub-cat:hover { border-color: var(--g-main_color); color: var(--g-main_color); }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-name { font-size: 13px; margin-bottom: 6px; }
.price-current { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
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
