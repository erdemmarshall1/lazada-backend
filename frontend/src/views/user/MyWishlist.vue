<template>
  <div>
    <h3>My Wishlist</h3>
    <div v-if="products.length === 0" class="c-no-list"><span class="c-no-list-text">Your wishlist is empty</span></div>
    <div class="product-grid" v-else>
      <div class="product-card" v-for="p in products" :key="p._id" @click="$router.push(`/gooddetail?id=${p._id}`)">
        <div class="product-img">
          <img :src="$imgUrl(p.images?.[0])" loading="lazy" @error="$imgFallback" />
          <div class="qv-overlay" @click.stop="openQuickView(p._id)"><span>Quick View</span></div>
        </div>
        <div class="product-info">
          <h4>{{ p.name }}</h4>
          <div class="product-price">${{ p.minPrice || p.skus?.[0]?.price || 0 }}</div>
        </div>
        <el-button size="small" circle class="remove-btn" @click.stop="remove(p._id)">
          <i class="iconfont icon-shanchu"></i>
        </el-button>
      </div>
    </div>
    <div v-if="total > pageSize" class="pagination-wrap g-flex-center" style="margin-top:16px">
      <el-pagination background layout="prev,next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="fetchList" />
    </div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const products = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const fetchList = async () => {
  const res = await qe(get('/home/userCollect/getProductList', { page: page.value, pageSize }))
  if (res?.data) {
    products.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const remove = async (productId) => {
  const res = await qe(post('/home/userCollect/product', { productId }))
  if (res) { ElMessage.success('Removed from wishlist'); fetchList() }
}

onMounted(fetchList)
</script>

<style scoped>
h3 { margin-bottom: 16px; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.product-card { background: var(--g-bg); border-radius: 8px; overflow: hidden; cursor: pointer; position: relative; transition: transform 0.2s; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px 12px 12px; }
.product-info h4 { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-price { font-size: 16px; font-weight: 700; color: var(--g-main_color); margin-top: 4px; }
.remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.9); z-index: 2; }
@media (max-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
</style>
