<template>
  <div class="list-view">
    <div class="list-container">
      <h2 class="list-title">⚡ Flash Sale</h2>
      <div class="product-grid" v-loading="loading">
        <div class="product-card" v-for="item in list" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="flash-badge">FLASH</div>
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="product-info">
            <h4 class="product-name g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-price">
              <span class="price-current">${{ item.flashSalePrice || item.minPrice }}</span>
              <span class="price-original">${{ item.maxPrice }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0 && !loading" class="c-no-list"><span class="c-no-list-text">No flash sales</span></div>
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

const list = ref([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = ref(20)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const onPageChange = (p) => {
  page.value = p
  loadData()
}

const loadData = async () => {
  loading.value = true
  const res = await get('/main/goods/getSearchList', { pageSize: pageSize.value, page: page.value })
  if (res?.data) {
    list.value = res.data.list || []
    total.value = res.data.total || 0
  }
  loading.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.list-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.list-container { max-width: var(--g-main-width); margin: 0 auto; }
.list-title { font-size: 20px; margin-bottom: 16px; color: var(--g-danger); }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); position: relative; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.flash-badge { position: absolute; top: 8px; left: 8px; background: var(--g-danger); color: #fff; padding: 2px 8px; border-radius: 2px; font-size: 11px; font-weight: 700; z-index: 2; }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; z-index: 1; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-name { font-size: 13px; margin-bottom: 6px; }
.price-current { font-size: 16px; font-weight: 700; color: var(--g-danger); }
.price-original { font-size: 12px; color: #999; text-decoration: line-through; margin-left: 6px; }
.pagination-wrap { margin-top: 24px; }
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
