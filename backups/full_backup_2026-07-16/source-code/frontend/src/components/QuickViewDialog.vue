<template>
  <el-dialog :model-value="visible" title="" width="760px" :close-on-click-modal="false" @close="emit('close')" @update:model-value="v => !v && emit('close')" class="quick-view-dialog">
    <div v-loading="loading" class="qv-body">
      <template v-if="product && !loading">
        <div class="qv-main g-flex">
          <div class="qv-left">
            <div class="qv-main-image">
              <el-image :src="$imgUrl(currentImage || product.images?.[0])" :preview-src-list="product.images?.map(i => $imgUrl(i)) || []" fit="cover" loading="lazy" @error="$imgFallback" />
            </div>
            <div class="qv-thumbs g-flex" v-if="product.images?.length > 1">
              <div class="qv-thumb" v-for="(img, idx) in product.images.slice(0, 4)" :key="idx" :class="{ active: currentImage === img }" @click="currentImage = img">
                <el-image :src="$imgUrl(img)" fit="cover" loading="lazy" @error="$imgFallback" />
              </div>
            </div>
          </div>
          <div class="qv-right">
            <h3 class="qv-name">{{ product.name }}</h3>
            <div class="qv-meta g-flex-align-center">
              <span>⭐ {{ product.rating || 5 }}</span>
              <span class="qv-divider">|</span>
              <span>{{ product.salesCount || 0 }} sold</span>
              <span class="qv-divider">|</span>
              <span>{{ product.reviewCount || 0 }} reviews</span>
            </div>
            <div class="qv-price-box">
              <span class="qv-price">${{ currentSku?.price || product.minPrice }}</span>
              <span class="qv-original" v-if="currentSku?.originalPrice">${{ currentSku.originalPrice }}</span>
            </div>
            <div class="qv-skus" v-for="(attr, idx) in skuAttrs" :key="idx">
              <div class="qv-sku-label">{{ attr.name }}:</div>
              <div class="qv-sku-values g-flex-wrap">
                <div class="qv-sku-value" v-for="val in attr.values" :key="val" :class="{ active: selectedAttrs[attr.name] === val }" @click="selectAttr(attr.name, val)">{{ val }}</div>
              </div>
            </div>
            <div class="qv-qty g-flex-align-center">
              <span class="qv-qty-label">Qty:</span>
              <el-input-number v-model="quantity" :min="1" :max="currentSku?.stock || 99" size="small" />
              <span class="qv-stock">{{ currentSku?.stock || 0 }} in stock</span>
            </div>
            <div class="qv-actions g-flex">
              <el-button type="primary" style="background:var(--g-main_color);border-color:var(--g-main_color);flex:1" :loading="cartLoading" @click="addToCart">Add to Cart</el-button>
              <el-button type="danger" style="flex:1" @click="buyNow">Buy Now</el-button>
              <el-button :type="isFavorited ? 'danger' : 'default'" :icon="isFavorited ? 'HeartFilled' : 'Heart'" circle @click="toggleWishlist" :loading="wishlistLoading" />
            </div>
            <div class="qv-footer">
              <el-button link type="primary" @click="viewFullDetails">View Full Details →</el-button>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="!loading" class="c-no-list"><span class="c-no-list-text">Product not found</span></div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { get, post, qe } from '@/api/request'

const props = defineProps({ visible: Boolean, productId: String })
const emit = defineEmits(['close', 'addedToCart'])
const router = useRouter()
const store = useAppStore()

const product = ref(null)
const loading = ref(false)
const currentImage = ref('')
const selectedAttrs = ref({})
const quantity = ref(1)
const cartLoading = ref(false)
const wishlistLoading = ref(false)
const isFavorited = ref(false)

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
  cartLoading.value = true
  const res = await qe(post('/home/userOrder/addCart', {
    productId: product.value._id,
    skuId: currentSku.value._id,
    quantity: quantity.value,
    price: currentSku.value.price,
  }))
  cartLoading.value = false
  if (res) { store.carNum++; ElMessage.success('Added to cart'); emit('addedToCart') }
}

const buyNow = async () => {
  if (!store.isLogin) return router.push('/login')
  if (!currentSku.value) return ElMessage.warning('Please select options')
  emit('close')
  router.push(`/createorder?productId=${product.value._id}&skuId=${currentSku.value._id}&quantity=${quantity.value}`)
}

const toggleWishlist = async () => {
  if (!store.isLogin) return router.push('/login')
  wishlistLoading.value = true
  const res = await qe(post('/home/userCollect/product', { productId: props.productId }))
  wishlistLoading.value = false
  if (res?.data) {
    isFavorited.value = res.data.favorited
    ElMessage.success(res.data.favorited ? 'Added to wishlist' : 'Removed from wishlist')
  }
}

const viewFullDetails = () => {
  emit('close')
  router.push(`/gooddetail?id=${props.productId}`)
}

watch(() => props.visible, async (val) => {
  if (!val || !props.productId) return
  loading.value = true
  product.value = null
  currentImage.value = ''
  selectedAttrs.value = {}
  quantity.value = 1
  isFavorited.value = false

  const [prodRes, favRes] = await Promise.all([
    get('/main/goods/getInfo', { id: props.productId }),
    store.isLogin ? get('/home/userCollect/check/' + props.productId) : Promise.resolve(null),
  ])
  if (prodRes?.data) {
    product.value = prodRes.data
    currentImage.value = product.value.images?.[0] || ''
    if (product.value.skus?.length > 0) {
      product.value.skus[0].attrs.forEach(a => {
        selectedAttrs.value[a.name] = a.value
      })
    }
  }
  if (favRes?.data) isFavorited.value = favRes.data.favorited
  loading.value = false
})
</script>

<style scoped>
.quick-view-dialog :deep(.el-dialog__body) { padding: 0; }
.quick-view-dialog :deep(.el-dialog__header) { display: none; }
.qv-body { min-height: 300px; }
.qv-main { gap: 20px; padding: 24px; }
.qv-left { width: 340px; flex-shrink: 0; }
.qv-main-image { width: 100%; aspect-ratio: 1; border: 1px solid var(--g-border); border-radius: 8px; overflow: hidden; }
.qv-main-image img { width: 100%; height: 100%; object-fit: cover; }
.qv-thumbs { gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.qv-thumb { width: 52px; height: 52px; border: 2px solid transparent; border-radius: 4px; overflow: hidden; cursor: pointer; }
.qv-thumb.active { border-color: var(--g-main_color); }
.qv-thumb img { width: 100%; height: 100%; object-fit: cover; }
.qv-right { flex: 1; min-width: 0; }
.qv-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; line-height: 1.3; }
.qv-meta { gap: 8px; font-size: 12px; color: #999; margin-bottom: 12px; flex-wrap: wrap; }
.qv-divider { color: #ddd; }
.qv-price-box { background: #fff5e6; padding: 10px 14px; border-radius: 4px; margin-bottom: 14px; }
.qv-price { font-size: 24px; font-weight: 700; color: var(--g-main_color); }
.qv-original { font-size: 14px; color: #999; text-decoration: line-through; margin-left: 10px; }
.qv-skus { margin-bottom: 12px; }
.qv-sku-label { font-size: 13px; color: #666; margin-bottom: 6px; }
.qv-sku-values { gap: 6px; }
.qv-sku-value { padding: 5px 14px; border: 1px solid var(--g-border); border-radius: 4px; cursor: pointer; font-size: 12px; min-height: 28px; display: flex; align-items: center; }
.qv-sku-value.active { border-color: var(--g-main_color); color: var(--g-main_color); background: #fff5e6; }
.qv-qty { gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.qv-qty-label { font-size: 13px; color: #666; }
.qv-stock { font-size: 11px; color: #999; }
.qv-actions { gap: 8px; flex-wrap: wrap; }
.qv-footer { margin-top: 16px; text-align: right; padding-top: 12px; border-top: 1px solid var(--g-border); }

@media (max-width: 768px) {
  :deep(.el-dialog) { width: 92% !important; max-width: 500px; }
  .qv-main { flex-direction: column; padding: 16px; }
  .qv-left { width: 100%; }
  .qv-name { font-size: 16px; }
  .qv-price { font-size: 20px; }
  .qv-actions .el-button { flex: 1 1 auto; }
}
</style>
