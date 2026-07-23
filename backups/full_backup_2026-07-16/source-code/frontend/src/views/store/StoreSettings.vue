<template>
  <div class="store-settings">
    <div v-if="!shop && !loading" class="ss-empty">
      <p>You don't have a store yet</p>
      <el-button type="primary" @click="$router.push('/applystore')">Apply Now</el-button>
    </div>

    <template v-else>
      <div class="ss-overview" v-loading="loading">
        <div class="ss-overview-header">
          <img v-if="shop.logo" :src="$imgUrl(shop.logo)" class="ss-logo" />
          <div v-else class="ss-logo-placeholder">
            <i class="iconfont icon-dianpu"></i>
          </div>
          <div class="ss-overview-info">
            <h3 class="ss-store-name">{{ shop.name || 'Store Name' }}</h3>
            <div class="ss-overview-meta">
              <span class="ss-tag">Store ID: {{ shop.storeNumber || 'N/A' }}</span>
              <span class="ss-tag">Level: {{ shop.level || 'Standard' }}</span>
              <span class="ss-tag">Balance: ${{ store.walletBalance.toFixed(2) }}</span>
              <span class="ss-tag">Rating: {{ shop.rating || 5 }}/5</span>
              <span class="ss-tag">Products: {{ totalInfo.productCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ss-metrics" v-loading="loading">
        <div class="ss-metric-card">
          <div class="ss-metric-icon credit"><i class="iconfont icon-anquan"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.creditScore || 100 }}</div>
            <div class="ss-metric-label">Credit Score</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon orders"><i class="iconfont icon-dingdan"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.todayOrderCount || 0 }}</div>
            <div class="ss-metric-label">Today's Orders</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon cumulative"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.orderCount || 0 }}</div>
            <div class="ss-metric-label">Cumulative Orders</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon sales"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.todayRevenue || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">Today's Sales</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon revenue"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.totalSales || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">Total Sales</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon profit-today"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.todayProfit || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">Today's Sales Profit</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon profit-total"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.totalProfit || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">Sales Profit</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon followers"><i class="iconfont icon-yonghu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ shop.followerCount || 0 }}</div>
            <div class="ss-metric-label">Number of Followers</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon balance"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ store.walletBalance.toFixed(2) }}</div>
            <div class="ss-metric-label">Account Balance</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { get } from '@/api/request'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const loading = ref(true)
const shop = ref({})
const totalInfo = ref({})

const fetchShopInfo = async () => {
  loading.value = true
  try {
    const [shopRes, totalRes] = await Promise.all([
      get('/home/userShop/getInfo'),
      get('/home/userShop/getTotalInfo'),
    ])
    if (shopRes?.data) shop.value = shopRes.data
    if (totalRes?.data) totalInfo.value = totalRes.data
  } catch {
    ElMessage.error('Failed to load store data')
  } finally {
    loading.value = false
  }
}

onMounted(fetchShopInfo)
</script>

<style scoped>
.store-settings { padding: 0; }
.ss-empty { text-align: center; padding: 60px 20px; color: var(--g-text-light); }
.ss-empty p { margin-bottom: 16px; font-size: 16px; }

.ss-overview { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 24px; margin-bottom: 20px; }
.ss-overview-header { display: flex; align-items: center; gap: 20px; }
.ss-logo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--g-border); flex-shrink: 0; }
.ss-logo-placeholder { width: 72px; height: 72px; border-radius: 50%; background: var(--g-bg); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--g-text-light); flex-shrink: 0; }
.ss-store-name { font-size: 20px; font-weight: 600; color: var(--g-text); margin: 0 0 8px 0; }
.ss-overview-meta { display: flex; flex-wrap: wrap; gap: 8px; }
.ss-tag { display: inline-block; padding: 4px 10px; background: #2c3e50; border: 1px solid transparent; border-radius: 4px; font-size: 12px; color: #fff; }

.ss-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.ss-metric-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 14px; }
.ss-metric-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; color: #fff; }
.ss-metric-icon.credit { background: #e74c3c; }
.ss-metric-icon.orders { background: #3498db; }
.ss-metric-icon.cumulative { background: #9b59b6; }
.ss-metric-icon.sales { background: #2ecc71; }
.ss-metric-icon.revenue { background: #f39c12; }
.ss-metric-icon.profit-today { background: #e67e22; }
.ss-metric-icon.profit-total { background: #1abc9c; }
.ss-metric-icon.followers { background: #e91e63; }
.ss-metric-icon.balance { background: #607d8b; }
.ss-metric-value { font-size: 20px; font-weight: 700; color: var(--g-text); }
.ss-metric-label { font-size: 12px; color: var(--g-text-light); margin-top: 2px; }

@media (max-width: 768px) {
  .ss-overview-header { flex-direction: column; text-align: center; }
  .ss-overview-meta { justify-content: center; }
  .ss-metrics { grid-template-columns: 1fr; }
}
</style>
