<template>
  <div class="mycenter-view">
    <div class="mycenter-container g-flex">
      <div class="mycenter-sidebar">
        <div class="user-card g-flex-align-center" v-if="store.isLogin">
          <div class="user-avatar"><img :src="$imgUrl(store.userInfo.avatar)" @error="$imgFallback" /></div>
          <div class="user-name">{{ store.userInfo.username }}</div>
        </div>
        <div class="menu-section" v-for="section in menuSections" :key="section.title">
          <div class="menu-title">{{ section.title }}</div>
          <div class="menu-item" v-for="item in section.items.filter(i => !i.hidden)" :key="item.path" :class="{ active: $route.path === item.path }" @click="$router.push(item.path)">
            <i :class="item.icon"></i>{{ item.label }}
          </div>
        </div>
      </div>
      <div class="mycenter-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
const store = useAppStore()
const isAdmin = computed(() => store.userInfo?.role === 'admin')
const menuSections = computed(() => {
  const sections = [
    {
      title: 'My Account', items: [
        { icon: 'iconfont icon-yonghu', label: 'My Account', path: '/myaccount' },
        { icon: 'iconfont icon-dingwei', label: 'Addresses', path: '/addresslist' },
        { icon: 'iconfont icon-yanjing', label: 'Browsing History', path: '/seehistory' },
        { icon: 'iconfont icon-shoucang', label: 'Wishlist', path: '/mywishlist' },
      ]
    },
    {
      title: 'Orders', items: [
        { icon: 'iconfont icon-dingdan', label: 'My Orders', path: '/myorder' },
        { icon: 'iconfont icon-wuliu', label: 'Order Tracking', path: '/ordertracking' },
        { icon: 'iconfont icon-jiaoyi', label: 'My Bills', path: '/mybill' },
      ]
    },
    {
      title: 'Finance', items: [
        { icon: 'iconfont icon-qianbao', label: 'Balance', path: '/balance' },
        { icon: 'iconfont icon-yinhangka_huaban', label: 'Bank Cards', path: '/bankcardlist' },
        { icon: 'iconfont icon-yue', label: 'Wallet', path: '/walletlist' },
        { icon: 'iconfont icon-tixianjilu', label: 'Recharge', path: '/rechargehistory' },
        { icon: 'iconfont icon-cashouthistory', label: 'Withdrawals', path: '/cashouthistory' },
      ]
    },
    {
      title: 'Store', items: [
        { icon: 'iconfont icon-dianpu', label: 'My Store', path: '/mystore' },
        { icon: 'iconfont icon-dianpufill', label: 'Products', path: '/storegoodcontrol' },
        { icon: 'iconfont icon-dingdan', label: 'Store Orders', path: '/storeordercontrol' },
        { icon: 'iconfont icon-wuliu', label: 'Logistics', path: '/sellerlogistics', hidden: !store.isAdmin },
        { icon: 'iconfont icon-shenqing', label: 'Apply Store', path: '/applystore', hidden: store.isSeller },
        { icon: 'iconfont icon-shoucang', label: 'Followed Stores', path: '/myfollowshop' },
        { icon: 'iconfont icon-ziyuanxhdpi', label: 'Wholesale', path: '/sourcegoods' },
      ]
    },
    {
      title: 'Messages', items: [
        { icon: 'iconfont icon-xiaoxi', label: 'Buyer Messages', path: '/chattostorelist' },
        { icon: 'iconfont icon-kefu', label: 'Seller Messages', path: '/chattouserlist' },
        { icon: 'iconfont icon-xinxi', label: 'Internal Messages', path: '/internalmsg' },
      ]
    },
  ]
  if (isAdmin.value) {
    sections.push({
      title: 'Admin', items: [
        { icon: 'iconfont icon-dashboard', label: 'Dashboard', path: '/admin-dashboard' },
        { icon: 'iconfont icon-dianpu', label: 'Sellers', path: '/admin-sellers' },
        { icon: 'iconfont icon-shangpin', label: 'Products', path: '/admin-products' },
        { icon: 'iconfont icon-jiaoyi', label: 'Transactions', path: '/admin-transactions' },
        { icon: 'iconfont icon-yonghu', label: 'Users', path: '/admin-users' },
        { icon: 'iconfont icon-coupon', label: 'Coupons', path: '/admin-coupons' },
        { icon: 'iconfont icon-anquan', label: 'Invitation Codes', path: '/admin-invitation-codes' },
        { icon: 'iconfont icon-shezhi', label: 'Payment Settings', path: '/admin-payment-settings' },
        { icon: 'iconfont icon-email', label: 'Email Settings', path: '/admin-email-settings' },
        { icon: 'iconfont icon-qianbao', label: 'Balance Mgmt', path: '/admin-balance' },
        { icon: 'iconfont icon-yue', label: 'Platform Wallet', path: '/admin-platform-wallet' },
      ]
    })
  }
  return sections
})
</script>

<style scoped>
.mycenter-view { flex: 1; background: var(--g-bg); padding: 20px 0; min-height: calc(100vh - 200px); }
.mycenter-container { max-width: var(--g-main-width); margin: 0 auto; gap: 20px; }
.mycenter-sidebar { width: 220px; flex-shrink: 0; }
.user-card { background: var(--g-white); border-radius: 8px; padding: 16px; gap: 12px; margin-bottom: 12px; }
.user-avatar { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 16px; font-weight: 600; }
.menu-section { background: var(--g-white); border-radius: 8px; padding: 12px 0; margin-bottom: 12px; }
.menu-title { padding: 8px 16px; font-size: 12px; color: #999; text-transform: uppercase; }
.menu-item { padding: 10px 16px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.menu-item:hover { color: var(--g-main_color); }
.menu-item.active { color: var(--g-main_color); font-weight: 600; background: #fff5e6; }
.menu-item .iconfont { font-size: 16px; }
.mycenter-content { flex: 1; background: var(--g-white); border-radius: 8px; padding: 24px; min-height: 500px; }
@media (max-width: 768px) {
  .mycenter-container { flex-direction: column; }
  .mycenter-sidebar { width: 100%; }
  .mycenter-content { padding: 16px; min-height: auto; }
  .menu-section { margin-bottom: 8px; }
}
</style>
