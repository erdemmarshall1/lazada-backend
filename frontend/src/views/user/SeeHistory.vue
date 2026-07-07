<template>
  <div><h3>Browsing History</h3><div class="product-grid" v-loading="loading"><div class="product-card" v-for="item in list" :key="item._id" @click="item.productId?._id && $router.push(`/gooddetail?id=${item.productId?._id}`)"><div class="product-img"><img :src="$imgUrl(item.productId?.images?.[0])" loading="lazy" @error="$imgFallback" /></div><div class="product-info"><h4 class="g-text-ellipsis">{{ item.productId?.name }}</h4><div class="product-price">${{ item.productId?.minPrice }}</div></div></div></div><div v-if="list.length===0 && !loading" class="c-no-list"><span class="c-no-list-text">No history</span></div><div class="pagination-wrap g-flex-center" v-if="totalPages > 1"><el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPageChange" /></div></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '@/api/request'

const list = ref([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = ref(20)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const onPageChange = (p) => {
  page.value = p
  loadData()
}

const loadData = async () => {
  loading.value = true
  const res = await get('/home/userCollect/getBrowseList', { pageSize: pageSize.value, page: page.value })
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
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
.product-card { border: 1px solid var(--g-border); border-radius: 8px; overflow: hidden; cursor: pointer; }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.product-info { padding: 8px; }
.product-price { color: var(--g-main_color); font-weight: 600; margin-top: 4px; }
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
