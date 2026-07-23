<template>
  <div class="store-settings">
    <div v-if="!shop && !loading" class="ss-promo">
      <div class="ss-promo-card">
        <div class="ss-promo-icon">&#128722;</div>
        <h2 class="ss-promo-title">{{ $t('store.settings.becomeMerchant') }}</h2>
        <p class="ss-promo-subtitle">{{ $t('store.settings.startSelling') }}</p>
        <div class="ss-promo-benefits">
          <div class="ss-benefit">
            <span class="ss-benefit-icon">&#10003;</span>
            <span>{{ $t('store.settings.globalCustomers') }}</span>
          </div>
          <div class="ss-benefit">
            <span class="ss-benefit-icon">&#10003;</span>
            <span>{{ $t('store.settings.easyManagement') }}</span>
          </div>
          <div class="ss-benefit">
            <span class="ss-benefit-icon">&#10003;</span>
            <span>{{ $t('store.settings.securePayment') }}</span>
          </div>
          <div class="ss-benefit">
            <span class="ss-benefit-icon">&#10003;</span>
            <span>{{ $t('store.settings.dedicatedSupport') }}</span>
          </div>
        </div>
        <el-button type="primary" size="large" class="ss-promo-btn" @click="$router.push('/applystore')">{{ $t('store.settings.applyButton') }}</el-button>
      </div>
    </div>

    <div v-else-if="shop && shop.status === 0" class="ss-pending">
      <div class="ss-pending-card">
        <div class="ss-pending-icon">&#9203;</div>
        <h3>{{ $t('store.settings.underReview') }}</h3>
        <p>{{ $t('store.settings.reviewDescription') }}</p>
        <div class="ss-pending-actions">
          <el-button type="primary" @click="$router.push('/applyconfirm')">{{ $t('store.settings.viewStatus') }}</el-button>
        </div>
      </div>
    </div>

    <div v-else-if="shop && shop.status === 3" class="ss-closed">
      <div class="ss-closed-card">
        <div class="ss-closed-icon">&#128274;</div>
        <h3>{{ $t('store.settings.storeClosed') }}</h3>
        <p>{{ $t('store.settings.closedDescription') }}</p>
      </div>
    </div>

    <template v-else-if="shop">
      <div class="ss-overview" v-loading="loading">
        <div class="ss-overview-header">
          <img v-if="shop.logo" :src="$imgUrl(shop.logo)" class="ss-logo" />
          <div v-else class="ss-logo-placeholder">
            <i class="iconfont icon-dianpu"></i>
          </div>
          <div class="ss-overview-info">
            <h3 class="ss-store-name">{{ shop.name || $t('store.settings.storeName') }}</h3>
            <div class="ss-overview-meta">
              <span class="ss-tag">{{ $t('store.settings.storeId') }} {{ shop.storeNumber || 'N/A' }}</span>
              <span class="ss-tag">{{ $t('store.settings.level') }} {{ shop.level || 'Standard' }}</span>
              <span class="ss-tag">{{ $t('store.settings.balance') }} ${{ store.walletBalance.toFixed(2) }}</span>
              <span class="ss-tag">{{ $t('store.settings.rating') }} {{ shop.rating || 5 }}/5</span>
              <span class="ss-tag">{{ $t('store.settings.products') }} {{ totalInfo.productCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ss-metrics" v-loading="loading">
        <div class="ss-metric-card">
          <div class="ss-metric-icon credit"><i class="iconfont icon-anquan"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.creditScore || 100 }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.creditScore') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon orders"><i class="iconfont icon-dingdan"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.todayOrderCount || 0 }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.todayOrders') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon cumulative"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ totalInfo.orderCount || 0 }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.cumulativeOrders') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon sales"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.todayRevenue || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.todaySales') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon revenue"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.totalSales || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.totalSales') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon profit-today"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.todayProfit || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.todayProfit') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon profit-total"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ (totalInfo.totalProfit || 0).toFixed(2) }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.salesProfit') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon followers"><i class="iconfont icon-yonghu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">{{ shop.followerCount || 0 }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.followers') }}</div>
          </div>
        </div>
        <div class="ss-metric-card">
          <div class="ss-metric-icon balance"><i class="iconfont icon-dianpu"></i></div>
          <div class="ss-metric-body">
            <div class="ss-metric-value">${{ store.walletBalance.toFixed(2) }}</div>
            <div class="ss-metric-label">{{ $t('store.settings.accountBalance') }}</div>
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
.ss-promo { padding: 20px 0; display: flex; justify-content: center; }
.ss-promo-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 12px; padding: 48px 40px; max-width: 560px; width: 100%; text-align: center; }
.ss-promo-icon { font-size: 56px; margin-bottom: 16px; }
.ss-promo-title { font-size: 28px; font-weight: 700; color: var(--g-text); margin: 0 0 8px; }
.ss-promo-subtitle { font-size: 15px; color: var(--g-text-light); margin: 0 0 32px; line-height: 1.6; }
.ss-promo-benefits { text-align: left; margin-bottom: 32px; display: flex; flex-direction: column; gap: 14px; }
.ss-benefit { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--g-text); line-height: 1.5; }
.ss-benefit-icon { color: var(--g-success); font-weight: 700; font-size: 16px; flex-shrink: 0; }
.ss-promo-btn { width: 100%; height: 48px; font-size: 16px; font-weight: 600; }

.ss-pending { padding: 20px 0; display: flex; justify-content: center; }
.ss-pending-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 12px; padding: 60px 40px; max-width: 500px; width: 100%; text-align: center; }
.ss-pending-icon { font-size: 56px; margin-bottom: 16px; }
.ss-pending-card h3 { font-size: 22px; font-weight: 700; color: var(--g-text); margin: 0 0 12px; }
.ss-pending-card p { font-size: 14px; color: var(--g-text-light); margin: 0 0 28px; line-height: 1.6; }

.ss-closed { padding: 20px 0; display: flex; justify-content: center; }
.ss-closed-card { background: var(--g-white); border: 1px solid var(--g-border); border-radius: 12px; padding: 60px 40px; max-width: 500px; width: 100%; text-align: center; }
.ss-closed-icon { font-size: 56px; margin-bottom: 16px; }
.ss-closed-card h3 { font-size: 22px; font-weight: 700; color: #f56c6c; margin: 0 0 12px; }
.ss-closed-card p { font-size: 14px; color: var(--g-text-light); margin: 0; line-height: 1.7; }

@media (max-width: 480px) {
  .ss-promo-card { padding: 32px 20px; }
  .ss-promo-title { font-size: 22px; }
  .ss-pending-card { padding: 40px 20px; }
  .ss-closed-card { padding: 40px 20px; }
}

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
