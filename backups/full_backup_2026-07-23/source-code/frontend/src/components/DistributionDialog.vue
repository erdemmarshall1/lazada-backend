<template>
  <el-dialog :model-value="visible" title="Distribute to Your Store" width="500px" :close-on-click-modal="false" @close="emit('close')" @update:model-value="v => !v && emit('close')">
    <div v-if="product">
      <div class="dist-product-summary g-flex-align-center" style="gap:12px;margin-bottom:16px">
        <img :src="$imgUrl(product.images?.[0])" @error="$imgFallback" style="width:60px;height:60px;border-radius:4px;object-fit:cover" />
        <div>
          <div class="dist-product-name">{{ product.name }}</div>
          <div class="dist-product-price">Wholesale: ${{ product.minPrice }}</div>
        </div>
      </div>

      <div class="dist-form">
        <div class="dist-field">
          <label>Markup Percentage</label>
          <el-input-number v-model="markup" :min="0" :max="1000" :step="5" style="width:100%" />
        </div>

        <div class="dist-field">
          <label>Your Retail Price</label>
          <div class="dist-retail-price">${{ retailPrice }}</div>
        </div>

        <div class="dist-note">
          Distribution is free. Wholesale cost will be deducted from your wallet when you ship an order.
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('close')">Cancel</el-button>
      <el-button type="danger" :loading="loading" @click="handleDistribute">Distribute to My Store</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { post } from '@/api/request'
import { ElMessage } from 'element-plus'

const props = defineProps({ product: Object, visible: Boolean })
const emit = defineEmits(['close', 'success'])

const markup = ref(20)
const loading = ref(false)

const retailPrice = computed(() => {
  if (!props.product?.minPrice) return '0.00'
  return (props.product.minPrice * (1 + markup.value / 100)).toFixed(2)
})

watch(() => props.visible, (val) => {
  if (val) {
    markup.value = props.product?.profitPercentage || 20
    loading.value = false
  }
})

const handleDistribute = async () => {
  loading.value = true
  try {
    const res = await post('/home/userGoods/distribute', {
      productId: props.product._id,
      markupPercentage: markup.value,
    })
    if (res.code === 0) {
      ElMessage.success('Product distributed!')
      emit('success')
      emit('close')
    } else {
      ElMessage.error(res.msg || res.message || 'Distribution failed')
    }
  } catch (e) {
    ElMessage.error(e?.message || 'Distribution failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dist-product-name { font-size: 14px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dist-product-price { font-size: 13px; color: var(--g-main_color); margin-top: 4px; }
.dist-form { margin: 16px 0; }
.dist-field { margin-bottom: 12px; }
.dist-field label { display: block; font-size: 13px; color: #999; margin-bottom: 4px; }
.dist-retail-price { font-size: 24px; font-weight: 700; color: var(--g-main_color); }
.dist-note { margin-top: 16px; padding: 10px 12px; background: #f0f9ff; border-radius: 6px; font-size: 12px; color: #666; line-height: 1.4; }
@media (max-width: 768px) {
  :deep(.el-dialog) { width: 90% !important; max-width: 400px; }
  .dist-product-summary { flex-wrap: wrap; }
  .dist-product-name { font-size: 13px; }
}
</style>
