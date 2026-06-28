<template>
  <div class="search-view">
    <div class="search-container">
      <h2 class="search-title">Search Stores</h2>
      <div class="search-filters g-flex-align-center">
        <el-input v-model="keyword" placeholder="Search stores..." size="large" style="width:400px" @keyup.enter="doSearch" />
        <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color)" @click="doSearch">Search</el-button>
      </div>
      <div class="store-list" v-if="stores.length > 0">
        <div class="store-card g-flex-align-center" v-for="store in stores" :key="store._id" @click="$router.push(`/storedetail?id=${store._id}`)">
          <div class="store-logo"><img :src="$imgUrl(store.logo)" @error="$imgFallback" /></div>
          <div class="store-info">
            <h4>{{ store.name }}</h4>
            <p>{{ store.description }}</p>
            <div class="store-meta"><span>⭐ {{ store.rating || 5 }}</span><span>Sales: {{ store.salesCount || 0 }}</span></div>
          </div>
        </div>
      </div>
      <div v-else class="c-no-list"><span class="c-no-list-text">No stores found</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/api/request'
const route = useRoute()
const keyword = ref('')
const stores = ref([])
const doSearch = async () => {
  const res = await get('/main/userShop/getList', { keyword: keyword.value, pageSize: 20 })
  if (res?.data) stores.value = res.data.list || []
}
onMounted(() => {
  if (route.query.keyword) {
    keyword.value = route.query.keyword
    doSearch()
  }
})
</script>

<style scoped>
.search-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.search-container { max-width: var(--g-main-width); margin: 0 auto; }
.search-title { font-size: 20px; margin-bottom: 16px; }
.search-filters { gap: 12px; margin-bottom: 20px; }
.store-list { display: flex; flex-direction: column; gap: 12px; }
.store-card { background: var(--g-white); border-radius: 8px; padding: 16px; cursor: pointer; gap: 16px; }
.store-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.store-logo { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.store-logo img { width: 100%; height: 100%; object-fit: cover; }
.store-info { flex: 1; }
.store-info h4 { font-size: 16px; margin-bottom: 4px; }
.store-info p { font-size: 13px; color: #666; margin-bottom: 4px; }
.store-meta { display: flex; gap: 16px; font-size: 12px; color: #999; }
@media (max-width: 768px) {
  .search-filters { flex-direction: column; }
  .search-filters .el-input { width: 100% !important; }
  .store-card { flex-direction: column; align-items: flex-start; padding: 12px; }
  .store-logo { width: 60px; height: 60px; }
}
</style>
