<template>
  <div>
    <h3>{{ $t('wholesale.detail.title') }}</h3>
      <div v-if="product" class="detail-main g-flex" style="gap:24px;margin-top:16px">
        <div class="detail-img-wrap">
          <img :src="$imgUrl(product.images?.[0])" style="width:400px;height:400px;object-fit:cover;border-radius:8px" loading="lazy" @error="$imgFallback" />
        </div>
      <div style="flex:1">
        <h2>{{ product.name }}</h2>
        <div class="product-price" style="font-size:24px;font-weight:700;color:var(--g-main_color);margin:16px 0">${{ product.minPrice }}</div>
        <div v-if="product.profitPercentage" style="font-size:14px;color:#e6a23c;margin-bottom:8px">{{ $t('wholesale.detail.profitLabel', { percentage: product.profitPercentage, retailPrice: '$' + (product.minPrice * (1 + product.profitPercentage/100)).toFixed(2) }) }}</div>
        <p style="color:#666;margin-bottom:16px">{{ product.description }}</p>
        <div style="display:flex;align-items:center;gap:12px">
          <el-button v-if="store.isSeller && !product.isDistributedByCurrentSeller" type="danger" size="large" @click="openDistribute">{{ $t('wholesale.detail.distribute') }}</el-button>
          <el-tag v-if="product.isDistributedByCurrentSeller" type="success" size="large" style="font-size:14px;padding:8px 16px">Distributed</el-tag>
        </div>
      </div>
    </div>

    <DistributionDialog :product="distProduct" :visible="distVisible" @close="distVisible = false" @success="onDistributeSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get } from '@/api/request'
import DistributionDialog from '@/components/DistributionDialog.vue'

const route = useRoute()
const store = useAppStore()
const product = ref(null)
const distVisible = ref(false)

const distProduct = computed(() => product.value)

const openDistribute = () => { distVisible.value = true }

const onDistributeSuccess = () => {
  if (product.value) {
    product.value.isDistributedByCurrentSeller = true
  }
  distProduct.value = null
}

onMounted(async () => { const res = await get('/main/goods/getInfo', { id: route.query.id }); if (res?.data) product.value = res.data })
</script>

<style scoped>
.detail-img-wrap { flex-shrink: 0; }
.detail-img-wrap img { width: 400px; height: 400px; object-fit: cover; border-radius: 8px; }

@media (max-width: 768px) {
  .detail-main { flex-direction: column; }
  .detail-img-wrap img { width: 100%; height: auto; aspect-ratio: 1; }
  .detail-main > div:last-child { padding: 0; }
}

@media (max-width: 480px) {
  .detail-img-wrap img { height: auto; }
}
</style>
