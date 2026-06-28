<template>
  <div class="store-view" v-loading="loading">
    <div class="store-container" v-if="shop">
      <div class="store-header g-flex-align-center">
        <div class="store-logo"><img :src="$imgUrl(shop.logo)" loading="lazy" @error="$imgFallback" /></div>
        <div class="store-info">
          <h2>{{ shop.name }}</h2>
          <p>{{ shop.description }}</p>
          <div class="store-meta"><span>⭐ {{ shop.rating || 5 }}</span><span>Products: {{ shop.productCount || 0 }}</span><span>Followers: {{ shop.followerCount || 0 }}</span></div>
        </div>
        <el-button type="primary" :plain="isFollowed" size="large" style="margin-left:auto" @click="toggleFollow">{{ isFollowed ? 'Following' : 'Follow' }}</el-button>
      </div>
      <h3 class="section-title">All Products</h3>
      <div class="product-grid">
        <div class="product-card" v-for="item in products" :key="item._id" @click="$router.push(`/gooddetail?id=${item._id}`)">
          <div class="product-img">
            <img :src="$imgUrl(item.images?.[0])" loading="lazy" @error="$imgFallback" />
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="product-info">
            <h4 class="g-text-ellipsis">{{ item.name }}</h4>
            <div class="product-price"><span class="price-current">${{ item.minPrice }}</span></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="c-no-list"><span class="c-no-list-text">Store not found</span></div>
    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const route = useRoute()
const store = useAppStore()
const shop = ref(null)
const products = ref([])
const isFollowed = ref(false)
const loading = ref(true)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')

const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const toggleFollow = async () => {
  if (!store.isLogin) return ElMessage.warning('Please login first')
  await qe(post('/home/userCollect/shop', { shopId: route.query.id }))
  isFollowed.value = !isFollowed.value
}

onMounted(async () => {
  const [shopRes, prodRes, followRes] = await Promise.all([
    get('/main/userShop/getInfo', { id: route.query.id }),
    get('/main/userShop/getGoodsList', { shopId: route.query.id }),
    store.isLogin ? get('/home/userCollect/getShopList', { pageSize: 99 }) : Promise.resolve(null),
  ])
  if (shopRes?.data) shop.value = shopRes.data
  if (prodRes?.data) products.value = prodRes.data.list || []
  if (followRes?.data) {
    const followed = followRes.data.list || followRes.data || []
    isFollowed.value = followed.some(s => s._id === route.query.id)
  }
  loading.value = false
})
</script>

<style scoped>
.store-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.store-container { max-width: var(--g-main-width); margin: 0 auto; }
.store-header { background: var(--g-white); border-radius: 8px; padding: 24px; gap: 20px; margin-bottom: 20px; }
.store-logo { width: 100px; height: 100px; border-radius: 8px; overflow: hidden; }
.store-logo img { width: 100%; height: 100%; object-fit: cover; }
.store-info h2 { font-size: 20px; margin-bottom: 8px; }
.store-info p { font-size: 14px; color: #666; margin-bottom: 8px; }
.store-meta { display: flex; gap: 16px; font-size: 13px; color: #999; }
.section-title { font-size: 18px; margin-bottom: 16px; }
.product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.product-card { background: var(--g-white); border-radius: 8px; overflow: hidden; cursor: pointer; border: 1px solid var(--g-border); }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.product-img { width: 100%; aspect-ratio: 1; overflow: hidden; position: relative; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.product-card:hover .qv-overlay { opacity: 1; }
.product-info { padding: 8px; }
.product-price .price-current { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
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
