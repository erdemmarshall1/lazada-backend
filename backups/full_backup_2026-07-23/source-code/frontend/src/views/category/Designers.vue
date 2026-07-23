<template>
  <div class="list-view">
    <div class="list-container">
      <div class="page-header">
        <h2 class="list-title">{{ $t('category.designers.title') }}</h2>
        <p class="list-subtitle">{{ $t('category.designers.description') }}</p>
      </div>
      <div class="designer-tags" v-if="tags.length > 0">
        <span class="tag-filter" :class="{ active: !selectedTag }" @click="filterByTag(null)">{{ $t('category.designers.all') }}</span>
        <span class="tag-filter" v-for="tag in tags" :key="tag" :class="{ active: selectedTag === tag }" @click="filterByTag(tag)">{{ tag }}</span>
      </div>
      <div class="product-grid">
        <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>{{ $t('category.designers.quickView') }}</span></div>
          </div>
          <div class="product-info">
            <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-designer" v-if="item.tags?.length">{{ item.tags[0] }}</div>
            <div class="product-price">
              <span class="price-current">${{ item.minPrice }}</span>
              <span class="price-original" v-if="item.maxPrice > item.minPrice">${{ item.maxPrice }}</span>
            </div>
            <div class="product-meta"><span>{{ $t('category.designers.sold') }} {{ item.salesCount || 0 }}</span><span>⭐ {{ item.rating || 5 }}</span></div>
          </div>
        </div>
      </div>
      <div v-if="products.length === 0" class="c-no-list"><span class="c-no-list-text">{{ $t('category.designers.empty') }}</span></div>
      <div class="pagination-wrap g-flex-center" v-if="totalPages > 1">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
      </div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const tags = ref([])
const selectedTag = ref(null)
const products = ref([])
const page = ref(1)
const total = ref(0)
const pageSize = ref(40)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }
const onPageChange = (p) => { page.value = p; loadProducts() }

const filterByTag = (tag) => {
  selectedTag.value = tag
  page.value = 1
  loadProducts()
}

const loadTags = async () => {
  const res = await get('/main/goods/getSearchList', { pageSize: 200, sort: 'sales' })
  if (res?.data?.list) {
    const tagSet = new Set()
    res.data.list.forEach(p => {
      if (p.tags && p.tags.length > 0) {
        p.tags.forEach(t => tagSet.add(t))
      }
    })
    tags.value = Array.from(tagSet).slice(0, 30)
  }
}

const loadProducts = async () => {
  const params = { pageSize: pageSize.value, page: page.value, sort: 'sales' }
  if (selectedTag.value) params.keyword = selectedTag.value
  const res = await get('/main/goods/getSearchList', params)
  if (res?.data) {
    products.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

onMounted(async () => {
  await loadTags()
  loadProducts()
})
</script>

<style scoped>
.list-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.list-container { max-width: var(--g-main-width); margin: 0 auto; }
.page-header { margin-bottom: 16px; }
.list-title { font-size: 24px; margin-bottom: 4px; }
.list-subtitle { color: #666; font-size: 14px; margin-bottom: 16px; }
.designer-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.tag-filter { padding: 6px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 13px; cursor: pointer; color: #555; transition: all 0.2s; }
.tag-filter:hover { border-color: #000; color: #000; }
.tag-filter.active { background: #000; color: #fff; border-color: #000; }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); transition: transform 0.2s; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-name { font-size: 13px; margin-bottom: 4px; }
.product-designer { font-size: 11px; color: #999; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.price-current { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
.price-original { font-size: 12px; color: #999; text-decoration: line-through; margin-left: 6px; }
.product-meta { display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-top: 4px; }
.pagination-wrap { margin-top: 24px; }
@media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
@media (max-width: 480px) { .product-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; } }
</style>
