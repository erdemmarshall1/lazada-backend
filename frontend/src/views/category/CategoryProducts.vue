<template>
  <div class="list-view">
    <div class="list-container">
      <div class="page-header">
        <h2 class="list-title">{{ categoryTitle }}</h2>
        <p class="list-subtitle">{{ categorySubtitle }}</p>
      </div>
      <div class="sub-nav" v-if="subCategories.length > 0">
        <span class="sub-nav-item" :class="{ active: !activeSub }" @click="filterSub(null)">All {{ categoryTitle }}</span>
        <span class="sub-nav-item" v-for="sub in subCategories" :key="sub._id" :class="{ active: activeSub === sub._id }" @click="filterSub(sub._id)">{{ sub.name }}</span>
      </div>
      <div class="product-grid">
        <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="product-info">
            <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-price">
              <span class="price-current">${{ item.minPrice }}</span>
              <span class="price-original" v-if="item.maxPrice > item.minPrice">${{ item.maxPrice }}</span>
            </div>
            <div class="product-meta"><span>Sold {{ item.salesCount || 0 }}</span><span>⭐ {{ item.rating || 5 }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="loading && products.length === 0" class="c-no-list"><span class="c-no-list-text">Loading...</span></div>
      <div v-if="!loading && products.length === 0" class="c-no-list"><span class="c-no-list-text">No products found in {{ categoryTitle }}</span></div>
      <div class="pagination-wrap g-flex-center" v-if="totalPages > 1">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
      </div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const route = useRoute()

const categories = ref([])
const subCategories = ref([])
const categoryId = ref(null)
const activeSub = ref(null)
const products = ref([])
const page = ref(1)
const total = ref(0)
const pageSize = ref(40)
const loading = ref(false)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const categorySlug = computed(() => route.params.slug || '')
const categoryTitle = computed(() => {
  const titles = { clothing: 'Clothing', shoes: 'Shoes', bags: 'Bags', accessories: 'Accessories' }
  return titles[categorySlug.value] || categorySlug.value.charAt(0).toUpperCase() + categorySlug.value.slice(1)
})
const categorySubtitle = computed(() => `Shop our curated selection of ${categorySlug.value}`)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }
const onPageChange = (p) => { page.value = p; loadProducts() }

const filterSub = (id) => {
  activeSub.value = id
  page.value = 1
  loadProducts()
}

const loadCategories = async () => {
  const res = await get('/main/goodsCategory/getList')
  if (res?.data) {
    categories.value = Array.isArray(res.data) ? res.data : res.data.list || []
    const parent = categories.value.find(c => c.name.toLowerCase() === categorySlug.value && c.level === 1)
    if (parent) {
      categoryId.value = parent._id
      subCategories.value = categories.value.filter(c => c.parentId === parent._id)
    } else {
      categoryId.value = null
      subCategories.value = []
    }
  }
}

const loadProducts = async () => {
  loading.value = true
  const params = { pageSize: pageSize.value, page: page.value, sort: 'sales' }
  if (activeSub.value) {
    params.categoryId = activeSub.value
  } else if (categoryId.value) {
    params.categoryId = categoryId.value
  }
  const res = await get('/main/goods/getSearchList', params)
  if (res?.data) {
    products.value = res.data.list || []
    total.value = res.data.total || 0
  }
  loading.value = false
}

onMounted(async () => {
  await loadCategories()
  loadProducts()
})

watch(() => route.params.slug, async () => {
  page.value = 1
  activeSub.value = null
  await loadCategories()
  loadProducts()
})
</script>

<style scoped>
.list-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.list-container { max-width: var(--g-main-width); margin: 0 auto; }
.page-header { margin-bottom: 16px; }
.list-title { font-size: 24px; margin-bottom: 4px; }
.list-subtitle { color: #666; font-size: 14px; margin-bottom: 16px; }
.sub-nav { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #e8e6e2; }
.sub-nav-item { padding: 8px 20px; font-size: 14px; cursor: pointer; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; white-space: nowrap; }
.sub-nav-item:hover { color: #000; }
.sub-nav-item.active { color: #000; font-weight: 600; border-bottom-color: #000; }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); transition: transform 0.2s; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-name { font-size: 13px; margin-bottom: 6px; }
.price-current { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
.price-original { font-size: 12px; color: #999; text-decoration: line-through; margin-left: 6px; }
.product-meta { display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-top: 4px; }
.pagination-wrap { margin-top: 24px; }
@media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
@media (max-width: 480px) { .product-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; } }
</style>
