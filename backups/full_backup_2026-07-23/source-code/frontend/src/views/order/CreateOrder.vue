<template>
  <div class="create-order-view">
    <div class="order-container">
      <h2>Create Order</h2>
      <div class="order-section">
        <h3>Shipping Address</h3>
        <div v-if="addresses.length === 0" class="c-no-list"><span class="c-no-list-text">No addresses. Please add one.</span></div>
        <el-radio-group v-model="selectedAddress" v-else>
          <el-radio v-for="addr in addresses" :key="addr._id" :value="addr._id" class="address-item">
            <div><strong>{{ addr.name }}</strong> {{ addr.phone }}</div>
            <div>{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
          </el-radio>
        </el-radio-group>
        <el-button type="primary" link @click="showAddAddress = true">+ Add New Address</el-button>
      </div>
      <div class="order-section">
        <h3>Order Items</h3>
        <div class="order-item" v-for="item in orderItems" :key="item.skuId">
          <div class="item-img"><img :src="$imgUrl(item.image)" loading="lazy" @error="$imgFallback" /></div>
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <p>${{ item.price }} x {{ item.quantity }}</p>
          </div>
          <div class="item-subtotal">${{ (item.price * item.quantity).toFixed(2) }}</div>
        </div>
        <div class="promo-section">
          <el-input v-model="couponCode" placeholder="Promo code" style="width:200px" @keyup.enter="validateCoupon" />
          <el-button size="small" :loading="validating" @click="validateCoupon">Apply</el-button>
          <span v-if="discount > 0" class="discount-text">- ${{ discount.toFixed(2) }}</span>
          <span v-if="couponError" class="coupon-error">{{ couponError }}</span>
        </div>
        <div class="order-total g-flex-align-center g-flex-justify-between">
          <span>Total: <strong class="total-price">${{ finalAmount.toFixed(2) }}</strong></span>
        </div>
      </div>
      <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color);width:200px" :loading="submitting" @click="submitOrder">Place Order</el-button>
    </div>
    <el-dialog v-model="showAddAddress" title="Add Address" width="500px">
      <el-form :model="newAddress" label-position="top">
        <el-form-item label="Name"><el-input v-model="newAddress.name" /></el-form-item>
        <el-form-item label="Phone"><el-input v-model="newAddress.phone" /></el-form-item>
        <el-form-item label="Province"><el-input v-model="newAddress.province" /></el-form-item>
        <el-form-item label="City"><el-input v-model="newAddress.city" /></el-form-item>
        <el-form-item label="Detail"><el-input v-model="newAddress.detail" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAddress = false">Cancel</el-button>
        <el-button type="primary" @click="addAddress">Save</el-button>
      </template>
    </el-dialog>
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
const addresses = ref([])
const selectedAddress = ref('')
const showAddAddress = ref(false)
const submitting = ref(false)

const newAddress = ref({ name: '', phone: '', province: '', city: '', detail: '' })

const orderItems = ref([])
const couponCode = ref('')
const discount = ref(0)
const validating = ref(false)
const couponError = ref('')

const totalAmount = computed(() => orderItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0))
const finalAmount = computed(() => Math.max(0, totalAmount.value - discount.value))

const addAddress = async () => {
  const res = await qe(post('/home/userAddress/add', newAddress.value))
  if (res) { showAddAddress.value = false; loadAddresses() }
}

const validateCoupon = async () => {
  if (!couponCode.value) return
  validating.value = true
  couponError.value = ''
  const res = await qe(post('/home/userOrder/coupon/validate', { code: couponCode.value, orderAmount: totalAmount.value }))
  validating.value = false
  if (res?.data) {
    discount.value = res.data.discount
    couponError.value = ''
  } else {
    discount.value = 0
    couponError.value = res?.msg || 'Invalid coupon'
  }
}

const submitOrder = async () => {
  if (!selectedAddress.value) return ElMessage.warning('Please select an address')
  submitting.value = true
  const address = addresses.value.find(a => a._id === selectedAddress.value)
  const body = {
    items: orderItems.value.map(i => ({ productId: i.productId, skuId: i.skuId, quantity: i.quantity })),
    shippingAddress: address,
  }
  if (couponCode.value && discount.value > 0) body.couponCode = couponCode.value
  const res = await qe(post('/home/userOrder/add', body))
  submitting.value = false
  if (res?.data) {
    router.push(`/paywait?orderId=${res.data._id}`)
  }
}

const loadAddresses = async () => {
  const res = await get('/home/userAddress/getList')
  if (res?.data) {
    addresses.value = res.data
    if (res.data.length > 0) selectedAddress.value = res.data[0]._id
  }
}

onMounted(async () => {
  await loadAddresses()
  if (route.query.productId) {
    const res = await get('/main/goods/getInfo', { id: route.query.productId })
    if (res?.data) {
      const p = res.data
      const sku = route.query.skuId ? p.skus?.find(s => s._id === route.query.skuId) : p.skus?.[0]
      orderItems.value = [{
        productId: p._id,
        skuId: sku?._id || '',
        name: p.name,
        price: sku?.price || p.minPrice || 0,
        quantity: parseInt(route.query.quantity || '1'),
        image: p.images?.[0] || '',
      }]
    }
  }
})
</script>

<style scoped>
.create-order-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.order-container { max-width: var(--g-main-width); margin: 0 auto; }
.order-section { background: var(--g-white); border-radius: 8px; padding: 20px; margin: 16px 0; }
.order-section h3 { font-size: 16px; margin-bottom: 12px; }
.address-item { display: block; padding: 12px; border: 1px solid var(--g-border); border-radius: 4px; margin-bottom: 8px; }
.order-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--g-border); }
.item-img { width: 80px; height: 80px; border-radius: 4px; overflow: hidden; }
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; }
.item-info h4 { font-size: 14px; }
.item-info p { font-size: 13px; color: #999; }
.item-subtotal { font-size: 16px; font-weight: 700; color: var(--g-main_color); }
.order-total { padding-top: 12px; }
.total-price { font-size: 20px; color: var(--g-main_color); }
.promo-section { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-top: 1px solid var(--g-border); }
.discount-text { color: var(--g-success); font-weight: 700; font-size: 16px; }
.coupon-error { color: #e74c3c; font-size: 13px; }
@media (max-width: 768px) {
  .order-section { padding: 12px; }
  .order-item { flex-wrap: wrap; gap: 8px; }
  .item-img { width: 60px; height: 60px; }
  .address-item { font-size: 13px; }
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
}
</style>
