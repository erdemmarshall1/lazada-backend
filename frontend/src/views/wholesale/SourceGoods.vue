<template>
  <div>
    <h3>Wholesale Center</h3>

    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="Search products..." clearable style="width:240px" @keyup.enter="onSearch" @clear="onSearch" />
      <el-select v-model="categoryId" placeholder="All Categories" clearable style="width:180px" @change="onSearch">
        <el-option v-for="cat in categories" :key="cat._id" :label="cat.name" :value="cat._id" />
      </el-select>
      <el-select v-model="sortBy" placeholder="Sort by" style="width:150px" @change="onSearch">
        <el-option label="Newest" value="new" />
        <el-option label="Price: Low to High" value="price_asc" />
        <el-option label="Price: High to Low" value="price_desc" />
        <el-option label="Best Sales" value="sales" />
        <el-option label="Top Rated" value="rating" />
      </el-select>
      <div class="price-range">
        <el-input-number v-model="minPrice" :min="0" placeholder="Min" size="small" style="width:100px" controls-position="right" />
        <span style="color:#999">—</span>
        <el-input-number v-model="maxPrice" :min="0" placeholder="Max" size="small" style="width:100px" controls-position="right" />
      </div>
      <el-button type="primary" @click="onSearch">Filter</el-button>
    </div>

    <div class="product-grid">
      <div class="product-card" v-for="item in list" :key="item._id">
        <div class="product-card-inner" @click="$router.push(`/sourcegoodsdetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="product-info"><h4 class="g-text-ellipsis">{{ item.name }}</h4><div class="product-price">${{ item.minPrice }}</div><div class="product-profit" v-if="item.profitPercentage">Profit {{ item.profitPercentage }}% → Retail ${{ (item.minPrice * (1 + item.profitPercentage/100)).toFixed(2) }}</div></div>
        </div>
        <div class="product-actions" v-if="store.isSeller">
          <el-button size="small" type="primary" plain @click.stop="openDistribute(item)">Distribute</el-button>
        </div>
      </div>
    </div>
    <div v-if="list.length===0 && !loading" class="c-no-list"><span class="c-no-list-text">No wholesale products</span></div>

    <div class="pagination-wrap g-flex-center" v-if="totalPages > 1">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <DistributionDialog :product="distProduct" :visible="distVisible" @close="distVisible = false" @success="distProduct = null" />
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { get } from '@/api/request'
import DistributionDialog from '@/components/DistributionDialog.vue'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const store = useAppStore()
const list = ref([])
const distProduct = ref(null)
const distVisible = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = ref(20)
const loading = ref(false)
const keyword = ref('')
const categoryId = ref('')
const sortBy = ref('new')
const minPrice = ref(null)
const maxPrice = ref(null)
const categories = ref([])
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const openDistribute = (item) => {
  distProduct.value = item
  distVisible.value = true
}

const onPageChange = (p) => {
  page.value = p
  loadData()
}

const onSearch = () => {
  page.value = 1
  loadData()
}

const loadData = async () => {
  loading.value = true
  const params = { pageSize: pageSize.value, page: page.value }
  if (keyword.value) params.keyword = keyword.value
  if (categoryId.value) params.categoryId = categoryId.value
  if (sortBy.value) {
    if (sortBy.value === 'price_asc') { params.sort = 'price'; params.order = 'asc' }
    else if (sortBy.value === 'price_desc') { params.sort = 'price'; params.order = 'desc' }
    else { params.sort = sortBy.value }
  }
  if (minPrice.value !== null && minPrice.value !== undefined) params.minPrice = minPrice.value
  if (maxPrice.value !== null && maxPrice.value !== undefined) params.maxPrice = maxPrice.value
  const res = await get('/main/goods/getSearchList', params)
  if (res?.data) {
    list.value = res.data.list || []
    total.value = res.data.total || 0
  }
  loading.value = false
}

onMounted(async () => {
  const catRes = await get('/main/goodsCategory/getList')
  if (catRes?.data) categories.value = catRes.data
  loadData()
})
</script>

<style scoped>
.filter-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 16px 0; padding: 12px 16px; background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; }
.filter-bar .price-range { display: flex; align-items: center; gap: 4px; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
.product-card { border: 1px solid var(--g-border); border-radius: 8px; overflow: hidden; cursor: pointer; background: var(--g-white); }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-price { color: var(--g-main_color); font-weight: 600; }
.product-profit { font-size: 11px; color: #e6a23c; margin-top: 4px; }
.product-actions { padding: 4px 8px 8px; text-align: center; }
@media (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-bar .price-range { justify-content: center; }
}
@media (max-width: 480px) {
  .product-grid { grid-template-columns: repeat(1, 1fr); gap: 8px; }
}
.pagination-wrap { margin-top: 24px; justify-content: center; }
@media (max-width: 768px) {
  .pagination-wrap { margin-top: 16px; }
  .pagination-wrap :deep(.el-pagination) { flex-wrap: wrap; justify-content: center; }
}
</style>
