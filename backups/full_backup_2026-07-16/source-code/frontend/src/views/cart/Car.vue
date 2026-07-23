<template>
  <div class="cart-view">
    <div class="cart-container">
      <h2 class="cart-title">Shopping Cart</h2>
      <div v-if="cartItems.length === 0" class="c-no-list">
        <span class="c-no-list-text">Your cart is empty</span>
        <el-button type="primary" style="margin-top:16px;background:var(--g-main_color);border-color:var(--g-main_color)" @click="$router.push('/main')">Go Shopping</el-button>
      </div>
      <template v-else>
        <div class="cart-list" v-loading="loading">
          <div class="cart-item g-flex-align-center" v-for="item in cartItems" :key="item._id">
            <el-checkbox v-model="item.checked" @change="calculateTotal" />
            <div class="item-img" @click="$router.push(`/gooddetail?id=${item.productId?._id}`)">
              <img :src="$imgUrl(item.productId?.images?.[0])" loading="lazy" @error="$imgFallback" />
            </div>
            <div class="item-info" @click="$router.push(`/gooddetail?id=${item.productId?._id}`)">
              <h4>{{ item.productId?.name || 'Product' }}</h4>
              <p class="item-sku" v-if="item.skuAttrs">{{ item.skuAttrs.map(a => `${a.name}:${a.value}`).join(', ') }}</p>
            </div>
            <div class="item-price">${{ item.price }}</div>
            <el-input-number v-model="item.quantity" :min="1" :max="99" size="small" @change="updateCart(item)" />
            <div class="item-subtotal">${{ (item.price * item.quantity).toFixed(2) }}</div>
            <div class="item-action" @click="removeItem(item)"><i class="iconfont icon-shanchu"></i></div>
          </div>
        </div>
        <div class="cart-footer g-flex-align-center g-flex-justify-between">
          <div class="footer-left g-flex-align-center">
            <el-checkbox v-model="allChecked" @change="toggleAll" /> Select All
            <span class="delete-selected" @click="removeSelected">Delete Selected</span>
          </div>
          <div class="footer-right g-flex-align-center">
            <div class="total-info">
              <span>Total: </span>
              <span class="total-price">${{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button type="primary" size="large" style="background:var(--g-main_color);border-color:var(--g-main_color);height:48px;width:160px" @click="checkout">Checkout</el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, qe } from '@/api/request'

const router = useRouter()
const store = useAppStore()
const cartData = ref(null)
const loading = ref(false)

const cartItems = computed(() => {
  return cartData.value?.items?.map(i => ({ ...i, checked: i.checked !== false })) || []
})

const allChecked = computed({
  get: () => cartItems.value.length > 0 && cartItems.value.every(i => i.checked),
  set: (val) => { cartItems.value.forEach(i => i.checked = val) },
})

const totalPrice = computed(() => {
  return cartItems.value.filter(i => i.checked).reduce((sum, i) => sum + i.price * i.quantity, 0)
})

const toggleAll = () => { cartItems.value.forEach(i => i.checked = allChecked.value) }

const updateCart = async (item) => {
  await qe(post('/home/userOrder/editCart', {
    productId: item.productId?._id, skuId: item.skuId, quantity: item.quantity,
  }))
}

const removeItem = async (item) => {
  try { await ElMessageBox.confirm('Remove this item from cart?', 'Confirm') } catch { return }
  await qe(post('/home/userOrder/delCart', {
    productId: item.productId?._id, skuId: item.skuId,
  }))
  await loadCart()
}

const removeSelected = async () => {
  try { await ElMessageBox.confirm('Remove selected items?', 'Confirm') } catch { return }
  const selected = cartItems.value.filter(i => i.checked)
  for (const item of selected) {
    await qe(post('/home/userOrder/delCart', {
      productId: item.productId?._id, skuId: item.skuId,
    }))
  }
  await loadCart()
}

const checkout = () => {
  const selected = cartItems.value.filter(i => i.checked)
  if (selected.length === 0) return ElMessage.warning('Please select items')
  const ids = selected.map(i => i.productId?._id).join(',')
  router.push(`/createcarorder?ids=${ids}`)
}

const loadCart = async () => {
  loading.value = true
  const res = await get('/home/userOrder/getCartList')
  if (res?.data) cartData.value = res.data
  loading.value = false
}

onMounted(loadCart)
</script>

<style scoped>
.cart-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.cart-container { max-width: var(--g-main-width); margin: 0 auto; }
.cart-title { font-size: 20px; margin-bottom: 16px; }
.cart-list { background: var(--g-white); border-radius: 8px; }
.cart-item { padding: 16px; gap: 16px; border-bottom: 1px solid var(--g-border); }
.item-img { width: 80px; height: 80px; border-radius: 4px; overflow: hidden; cursor: pointer; }
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; cursor: pointer; }
.item-info h4 { font-size: 14px; margin-bottom: 4px; }
.item-sku { font-size: 12px; color: #999; }
.item-price { width: 100px; font-size: 14px; color: var(--g-main_color); font-weight: 600; }
.item-subtotal { width: 100px; font-size: 14px; color: var(--g-main_color); font-weight: 700; }
.item-action { cursor: pointer; color: #999; }
.item-action:hover { color: var(--g-danger); }
.cart-footer { background: var(--g-white); border-radius: 8px; margin-top: 16px; padding: 16px 24px; }
.footer-left { gap: 12px; font-size: 14px; }
.delete-selected { cursor: pointer; color: var(--g-text-light); }
.delete-selected:hover { color: var(--g-danger); }
.footer-right { gap: 20px; }
.total-info { font-size: 14px; }
.total-price { font-size: 24px; font-weight: 700; color: var(--g-main_color); }

@media (max-width: 768px) {
  .cart-view { padding: 12px 0; }
  .cart-container { padding: 0 12px; }
  .cart-item { flex-wrap: wrap; gap: 8px; padding: 12px; position: relative; }
  .item-img { width: 60px; height: 60px; }
  .item-info { width: calc(100% - 76px); flex: none; }
  .item-price { width: auto; margin-left: 68px; }
  .item-subtotal { width: auto; }
  .item-action { position: absolute; top: 12px; right: 12px; }
  .cart-footer { flex-direction: column; gap: 12px; padding: 12px 16px; }
  .footer-right { width: 100%; flex-direction: column; gap: 8px; }
  .footer-right .el-button { width: 100%; }
}
</style>
