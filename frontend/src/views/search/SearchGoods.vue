<template>
  <div class="search-view" v-loading="loading">
    <div class="search-container">
      <div class="search-filters g-flex-align-center g-flex-wrap">
        <el-autocomplete
          v-model="keyword"
          :fetch-suggestions="querySuggestions"
          :trigger-on-focus="false"
          :placeholder="$t('search.goods.searchPlaceholder')"
          size="large"
          style="width:400px"
          clearable
          @keyup.enter="doSearch"
          @clear="onClear"
          @select="onSuggestionSelect"
        >
          <template #default="{ item }">
            <div class="suggestion-item" @click="onSuggestionSelect(item)">
              <img :src="$imgUrl(item.images?.[0])" class="suggestion-img" @error="$imgFallback" />
              <div class="suggestion-info">
                <span class="suggestion-name">{{ item.name }}</span>
                <span class="suggestion-price">${{ item.minPrice }}</span>
              </div>
            </div>
          </template>
        </el-autocomplete>
        <el-select v-model="sortBy" :placeholder="$t('search.goods.sortPlaceholder')" size="large" style="width:140px" @change="doSearch">
          <el-option :label="$t('wholesale.center.relevance')" value="relevance" />
          <el-option :label="$t('search.goods.sortDefault')" value="" />
          <el-option :label="$t('wholesale.center.priceLowHigh')" value="price_asc" />
          <el-option :label="$t('wholesale.center.priceHighLow')" value="price_desc" />
          <el-option :label="$t('search.goods.bestSelling')" value="sales" />
          <el-option :label="$t('wholesale.center.newest')" value="new" />
        </el-select>
        <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="doSearch">{{ $t('common.search') }}</el-button>
      </div>
      <div v-if="!loading && products.length === 0" class="c-no-list"><span class="c-no-list-text">{{ $t('search.goods.empty') }}</span></div>
      <div class="product-grid" v-if="products.length > 0">
        <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>{{ $t('search.goods.quickView') }}</span></div>
          </div>
          <div class="product-info">
            <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-price"><span class="price-current">${{ item.minPrice }}</span></div>
            <div class="product-meta"><span>{{ $t('search.goods.sold') }} {{ item.salesCount || 0 }}</span><span>⭐ {{ item.rating || 5 }}</span></div>
          </div>
        </div>
      </div>
      <div class="pagination-wrap g-flex-center" v-if="totalPages > 1">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
      </div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const sortBy = ref('relevance')
const products = ref([])
const page = ref(1)
const total = ref(0)
const pageSize = ref(40)
const loading = ref(false)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')
let debounceTimer = null

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const onPageChange = (p) => {
  page.value = p
  doSearch()
}

const onClear = () => {
  keyword.value = ''
  page.value = 1
  doSearch()
}

const onSuggestionSelect = (item) => {
  keyword.value = item.value || item.name
  doSearch()
}

const querySuggestions = async (query, cb) => {
  if (!query || query.length < 2) { cb([]); return }
  try {
    const res = await get('/main/goods/getSuggestions', { keyword: query })
    cb((res?.data || []).map(p => ({ value: p.name, ...p })))
  } catch {
    cb([])
  }
}

const doSearch = async () => {
  loading.value = true
  const params = { pageSize: pageSize.value, page: page.value }
  if (keyword.value) params.keyword = keyword.value
  if (sortBy.value) {
    const [sort, order] = sortBy.value.split('_')
    params.sort = sort
    if (order) params.order = order
  }
  if (route.query.categoryId) params.categoryId = route.query.categoryId
  try {
    const res = await get('/main/goods/getSearchList', params)
    if (res?.data) {
      products.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err) {
    ElMessage.error('Search failed')
  }
  loading.value = false
}

onMounted(() => {
  if (route.query.keyword) keyword.value = route.query.keyword
  doSearch()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search-view { flex: 1; background: var(--g-bg); padding: 20px 0; min-height: 400px; }
.search-container { max-width: var(--g-main-width); margin: 0 auto; }
.search-filters { gap: 12px; margin-bottom: 20px; }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.suggestion-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.suggestion-img { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.suggestion-info { display: flex; flex-direction: column; min-width: 0; }
.suggestion-name { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-price { font-size: 11px; color: var(--g-main_color); font-weight: 600; }
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
.pagination-wrap { margin-top: 24px; }

@media (max-width: 768px) {
  .search-filters .el-input { width: 100% !important; }
  .search-filters .el-select { width: 100% !important; }
  .search-filters .el-button { width: 100%; }
}
@media (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
