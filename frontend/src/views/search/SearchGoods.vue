<template>
  <div class="search-view">
    <div class="search-container">
      <div class="search-filters g-flex-align-center g-flex-wrap">
        <el-input v-model="keyword" placeholder="Search products..." size="large" style="width:400px" @keyup.enter="doSearch" />
        <el-select v-model="sortBy" placeholder="Sort" size="large" style="width:140px" @change="doSearch">
          <el-option label="Default" value="" />
          <el-option label="Price: Low to High" value="price_asc" />
          <el-option label="Price: High to Low" value="price_desc" />
          <el-option label="Best Selling" value="sales" />
          <el-option label="Newest" value="new" />
        </el-select>
        <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="doSearch">Search</el-button>
      </div>
      <div class="product-grid" v-if="products.length > 0">
        <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
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
      <div v-else class="c-no-list"><span class="c-no-list-text">No products found</span></div>
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const route = useRoute()
const keyword = ref('')
const sortBy = ref('')
const products = ref([])
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const doSearch = async () => {
  const params = { pageSize: 40 }
  if (keyword.value) params.keyword = keyword.value
  if (sortBy.value) {
    const [sort, order] = sortBy.value.split('_')
    params.sort = sort
    params.order = order
  }
  if (route.query.categoryId) params.categoryId = route.query.categoryId
  const res = await get('/main/goods/getSearchList', params)
  if (res?.data) products.value = res.data.list || []
}

onMounted(() => {
  if (route.query.keyword) keyword.value = route.query.keyword
  doSearch()
})
</script>

<style scoped>
.search-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.search-container { max-width: var(--g-main-width); margin: 0 auto; }
.search-filters { gap: 12px; margin-bottom: 20px; }
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

@media (max-width: 768px) {
  .search-filters .el-input { width: 100% !important; }
  .search-filters .el-select { width: 100% !important; }
  .search-filters .el-button { width: 100%; }
}
@media (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
