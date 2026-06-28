<template>
  <div class="detail-view" v-loading="loading">
    <div class="detail-container" v-if="product">
      <div class="detail-main g-flex">
        <div class="detail-left">
          <div class="detail-images">
            <div class="main-image">
              <el-image :src="$imgUrl(currentImage || product.images?.[0])" :zoom-rate="1.2" :preview-src-list="product.images?.map(i => $imgUrl(i)) || []" fit="cover" loading="lazy" @error="$imgFallback">
                <template #error><div class="image-error" @error="$imgFallback"></div></template>
              </el-image>
            </div>
            <div class="thumb-list g-flex" v-if="product.images?.length > 0">
              <div class="thumb-item" v-for="(img, idx) in product.images" :key="idx" :class="{ active: currentImage === img }" @click="currentImage = img">
                <el-image :src="$imgUrl(img)" fit="cover" loading="lazy" @error="$imgFallback" />
              </div>
            </div>
          </div>
          <div class="action-buttons g-flex">
            <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color);flex:1" @click="addToCart">Add to Cart</el-button>
            <el-button type="danger" size="large" style="flex:1" @click="buyNow">Buy Now</el-button>
          </div>
        </div>
        <div class="detail-info">
          <div class="product-name-row g-flex-align-center">
            <h1 class="product-name">{{ product.name }}</h1>
            <el-button :type="isFavorited ? 'danger' : 'default'" :icon="isFavorited ? 'HeartFilled' : 'Heart'" circle size="small" @click="toggleWishlist" :loading="wishlistLoading" />
          </div>
          <div class="product-price-box g-flex-align-center">
            <span class="price-current">${{ currentSku?.price || product.minPrice }}</span>
            <span class="price-original" v-if="currentSku?.originalPrice">${{ currentSku.originalPrice }}</span>
          </div>
          <div class="product-meta g-flex-align-center">
            <span>Sold: {{ product.salesCount || 0 }}</span>
            <span class="divider">|</span>
            <span>Reviews: {{ product.reviewCount || 0 }}</span>
            <span class="divider">|</span>
            <span>Rating: ⭐ {{ product.rating || 5 }}</span>
          </div>
          <div class="sku-section" v-for="(attr, idx) in skuAttrs" :key="idx">
            <div class="sku-label">{{ attr.name }}:</div>
            <div class="sku-values g-flex-wrap">
              <div class="sku-value" v-for="val in attr.values" :key="val" :class="{ active: selectedAttrs[attr.name] === val }" @click="selectAttr(attr.name, val)">{{ val }}</div>
            </div>
          </div>
          <div class="quantity-section g-flex-align-center">
            <span class="qty-label">Quantity:</span>
            <el-input-number v-model="quantity" :min="1" :max="currentSku?.stock || 99" size="small" />
            <span class="stock-text">{{ currentSku?.stock || 0 }} in stock</span>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <h3>Description</h3>
        <div class="product-desc">{{ product.description }}</div>
      </div>
      <div class="detail-section">
        <h3>Reviews ({{ product.reviewCount || 0 }})</h3>
        <div v-if="reviews.length === 0" class="c-no-list">
          <span class="c-no-list-text">No reviews yet</span>
        </div>
        <div class="review-item" v-for="review in reviews" :key="review._id">
          <div class="review-user g-flex-align-center">
            <span class="review-username">{{ review.userId?.username || 'Anonymous' }}</span>
            <span class="review-rating">⭐ {{ review.rating }}</span>
          </div>
          <p class="review-content">{{ review.content }}</p>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="c-no-list"><span class="c-no-list-text">Product not found</span></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const product = ref(null)
const reviews = ref([])
const quantity = ref(1)
const currentImage = ref('')
const selectedAttrs = ref({})
const loading = ref(true)
const isFavorited = ref(false)
const wishlistLoading = ref(false)

const currentSku = computed(() => {
  if (!product.value?.skus) return null
  return product.value.skus.find(sku => {
    return sku.attrs.every(a => selectedAttrs.value[a.name] === a.value)
  }) || product.value.skus[0]
})

const skuAttrs = computed(() => {
  if (!product.value?.skus) return []
  const attrMap = {}
  product.value.skus.forEach(sku => {
    sku.attrs.forEach(a => {
      if (!attrMap[a.name]) attrMap[a.name] = new Set()
      attrMap[a.name].add(a.value)
    })
  })
  return Object.entries(attrMap).map(([name, values]) => ({
    name, values: Array.from(values),
  }))
})

const selectAttr = (name, value) => {
  selectedAttrs.value[name] = value
}

const addToCart = async () => {
  if (!store.isLogin) return router.push('/login')
  if (!currentSku.value) return ElMessage.warning('Please select options')
  const res = await qe(post('/home/userOrder/addCart', {
    productId: product.value._id,
    skuId: currentSku.value._id,
    quantity: quantity.value,
    price: currentSku.value.price,
  }))
  if (res) { store.carNum++; ElMessage.success('Added to cart') }
}

const buyNow = async () => {
  if (!store.isLogin) return router.push('/login')
  if (!currentSku.value) return ElMessage.warning('Please select options')
  router.push(`/createorder?productId=${product.value._id}&skuId=${currentSku.value._id}&quantity=${quantity.value}`)
}

const toggleWishlist = async () => {
  if (!store.isLogin) return router.push('/login')
  wishlistLoading.value = true
  const res = await qe(post('/home/userCollect/product', { productId: route.query.id }))
  wishlistLoading.value = false
  if (res?.data) {
    isFavorited.value = res.data.favorited
    ElMessage.success(res.data.favorited ? 'Added to wishlist' : 'Removed from wishlist')
  }
}

onMounted(async () => {
  const promises = [
    get('/main/goods/getInfo', { id: route.query.id }),
    get('/main/goods/getReviewsList', { productId: route.query.id, pageSize: 10 }),
  ]
  if (store.isLogin) {
    promises.push(get('/home/userCollect/check/' + route.query.id))
  }
  const [prodRes, revRes, favRes] = await Promise.all(promises)
  if (prodRes?.data) {
    product.value = prodRes.data
    currentImage.value = product.value.images?.[0] || ''
    if (product.value.skus?.length > 0) {
      product.value.skus[0].attrs.forEach(a => {
        selectedAttrs.value[a.name] = a.value
      })
    }
  }
  if (revRes?.data) reviews.value = revRes.data.list || []
  if (favRes?.data) isFavorited.value = favRes.data.favorited
  loading.value = false
})
</script>

<style scoped>
.detail-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.detail-container { max-width: var(--g-main-width); margin: 0 auto; padding: 0 16px; }
.detail-main { gap: 24px; background: var(--g-white); border-radius: 8px; padding: 24px; }
.detail-left { width: 480px; flex-shrink: 0; }
.detail-images { width: 100%; }
.main-image { width: 100%; aspect-ratio: 1; border: 1px solid var(--g-border); border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
.main-image img { width: 100%; height: 100%; object-fit: cover; }
.thumb-list { gap: 8px; flex-wrap: wrap; }
.thumb-item { width: 64px; height: 64px; border: 2px solid transparent; border-radius: 4px; overflow: hidden; cursor: pointer; }
.thumb-item.active { border-color: var(--g-main_color); }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.detail-info { flex: 1; }
.action-buttons { gap: 12px; margin-top: 16px; }
.product-name-row { gap: 12px; margin-bottom: 16px; }
.product-name-row h1 { margin-bottom: 0; }
.product-name { font-size: 20px; font-weight: 600; }
.product-price-box { background: #fff5e6; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; }
.price-current { font-size: 28px; font-weight: 700; color: var(--g-main_color); }
.price-original { font-size: 16px; color: #999; text-decoration: line-through; margin-left: 12px; }
.product-meta { gap: 8px; font-size: 13px; color: #666; margin-bottom: 20px; flex-wrap: wrap; }
.divider { color: #ddd; }
.sku-section { margin-bottom: 16px; }
.sku-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.sku-values { gap: 8px; }
.sku-value { padding: 6px 16px; border: 1px solid var(--g-border); border-radius: 4px; cursor: pointer; font-size: 13px; min-height: 32px; display: flex; align-items: center; }
.sku-value.active { border-color: var(--g-main_color); color: var(--g-main_color); background: #fff5e6; }
.quantity-section { gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.qty-label { font-size: 14px; color: #666; }
.stock-text { font-size: 12px; color: #999; white-space: nowrap; }
.action-buttons { gap: 12px; }
.detail-section { background: var(--g-white); border-radius: 8px; padding: 24px; margin: 16px 16px 0; }
.detail-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--g-border); }
.product-desc { font-size: 14px; line-height: 1.8; color: #666; }
.review-item { padding: 12px 0; border-bottom: 1px solid var(--g-border); }
.review-user { gap: 8px; margin-bottom: 6px; }
.review-username { font-weight: 600; font-size: 14px; }
.review-rating { font-size: 13px; }
.review-content { font-size: 14px; color: #666; }

@media (max-width: 768px) {
  .detail-view { padding: 12px 0; }
  .detail-main { flex-direction: column; padding: 16px; }
  .detail-left { width: 100%; }
  .detail-section { margin: 12px 0; padding: 16px; }
  .product-name { font-size: 17px; }
  .price-current { font-size: 24px; }
  .action-buttons { flex-direction: column; }
  .action-buttons .el-button { width: 100%; }
}

@media (max-width: 480px) {
  .detail-main { padding: 12px; }
  .detail-section { padding: 12px; }
  .product-price-box { padding: 10px 12px; }
  .thumb-item { width: 52px; height: 52px; }
}
</style>
