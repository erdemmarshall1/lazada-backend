<template>
  <div class="mycenter-view">
    <div class="mycenter-container g-flex">
      <button class="mycenter-sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        <span v-if="!sidebarOpen">&#9776; Menu</span>
        <span v-else>&times; Close</span>
      </button>
      <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen = false"></div>
      <div class="mycenter-sidebar" :class="{ open: sidebarOpen }">
        <div class="user-card g-flex-align-center glow-user-card" v-if="store.isLogin">
          <div class="user-avatar"><img :src="$imgUrl(store.userInfo.avatar)" @error="$imgFallback" /></div>
          <div class="user-name">{{ store.userInfo.username }}</div>
        </div>
        <div class="menu-section glow-menu-section" v-for="section in menuSections" :key="section.title">
          <div class="menu-title glow-menu-title" @click="toggleSection(section.title)">
            <span>{{ isCollapsed(section.title) ? '▶' : '▼' }}</span>
            {{ section.title }}
          </div>
          <div class="menu-item glow-menu-item" v-for="item in section.items.filter(i => !i.hidden)" :key="item.path" v-show="!isCollapsed(section.title)" :class="{ active: $route.path === item.path, 'glow-menu-item--active': $route.path === item.path }" @click="$router.push(item.path)">
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
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
const store = useAppStore()
const sidebarOpen = ref(false)

watch(sidebarOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
const isAdmin = computed(() => store.userInfo?.role === 'admin')
const collapsedSections = ref(new Set())
const toggleSection = (title) => {
  if (collapsedSections.value.has(title)) {
    collapsedSections.value.delete(title)
  } else {
    collapsedSections.value.add(title)
  }
}
const isCollapsed = (title) => collapsedSections.value.has(title)
const menuSections = computed(() => {
  const sections = [
    {
      title: 'My Account', items: [
        { icon: 'iconfont icon-yonghu', label: 'My Account', path: '/myaccount' },
        { icon: 'iconfont icon-dingwei', label: 'Addresses', path: '/addresslist' },
{ icon: 'iconfont icon-yanjing', label: 'Browsing History', path: '/seehistory' },
        { icon: 'iconfont icon-shoucang', label: 'Wishlist', path: '/mywishlist' },
        { icon: 'iconfont icon-xinxi', label: 'My Inquiries', path: '/mysubmissions' },
      ]
    },
    {
      title: 'Privacy & Security', items: [
        { icon: 'iconfont icon-mima', label: 'Privacy Settings', path: '/privacysettings' },
        { icon: 'iconfont icon-anquan', label: 'Two-Factor Auth', path: '/2fa' },
        { icon: 'iconfont icon-mima', label: 'Change Password', path: '/changepassword' },
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
        { icon: 'iconfont icon-tixianjilu', label: 'Deposit', path: '/rechargehistory' },
        { icon: 'iconfont icon-cashouthistory', label: 'Withdrawals', path: '/cashouthistory' },
      ]
    },
    {
      title: 'Store', items: [
        { icon: 'iconfont icon-dianpu', label: 'My Store', path: '/mystore' },
        { icon: 'iconfont icon-dianpufill', label: 'Products', path: '/storegoodcontrol' },
        { icon: 'iconfont icon-dingdan', label: 'Store Orders', path: '/storeordercontrol' },
        { icon: 'iconfont icon-wuliu', label: 'Logistics', path: '/seller-logistics', hidden: !store.isAdmin },
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
        { icon: 'iconfont icon-kefu', label: 'Live Chat Inbox', path: '/admin-livechat-inbox', hidden: !store.isAdmin },
        { icon: 'iconfont icon-shezhi', label: 'Live Chat Settings', path: '/admin-livechat-settings', hidden: !store.isAdmin },
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
        { icon: 'iconfont icon-zhuti', label: 'Theme Settings', path: '/admin-theme-settings' },
        { icon: 'iconfont icon-anquan', label: 'User Privacy', path: '/admin-user-privacy/' + (store.userInfo?._id || '') },
        { icon: 'iconfont icon-dashboard', label: 'Super Admin', path: '/superadmin-dashboard' },
        { icon: 'iconfont icon-tupian', label: 'Banners', path: '/admin-banners' },
        { icon: 'iconfont icon-anquan', label: 'Roles', path: '/admin-roles' },
        { icon: 'iconfont icon-shangpin', label: 'CMS Pages', path: '/admin-cms-pages' },
        { icon: 'iconfont icon-shangpin', label: 'CMS Blogs', path: '/admin-cms-blogs' },
        { icon: 'iconfont icon-shangpin', label: 'CMS FAQs', path: '/admin-cms-faqs' },
        { icon: 'iconfont icon-shangpin', label: 'CMS Menus', path: '/admin-cms-menus' },
        { icon: 'iconfont icon-shangpin', label: 'Reviews', path: '/admin-reviews' },
        { icon: 'iconfont icon-dashboard', label: 'Reports', path: '/admin-reports' },
        { icon: 'iconfont icon-shangpin', label: 'Homepage Sections', path: '/admin-homepage-sections' },
        { icon: 'iconfont icon-shezhi', label: 'Settings', path: '/admin-settings' },
        { icon: 'iconfont icon-anquan', label: 'Sessions & Audit', path: '/admin-sessions-audit' },
        { icon: 'iconfont icon-xinxi', label: 'Inquiries', path: '/admin-submissions' },
        { icon: 'iconfont icon-kefu', label: 'Tawk.to Chat', path: '/admin-tawkto-settings' },
      ]
    })
  }
  return sections
})
</script>

<style scoped>
.mycenter-view { flex: 1; background: var(--g-bg); padding: 20px 0; min-height: calc(100vh - 200px); }
.mycenter-container { max-width: var(--g-main-width); margin: 0 auto; gap: 20px; }
.mycenter-sidebar { width: 220px; flex-shrink: 0; max-height: calc(100vh - 250px); overflow-y: auto; }
.mycenter-sidebar-toggle { display: none; align-items: center; gap: 8px; padding: 10px 16px; margin-bottom: 12px; background: var(--g-white); border: 1px solid var(--g-border); border-radius: 8px; font-size: 14px; cursor: pointer; color: #000; width: 100%; justify-content: center; }
.mycenter-sidebar-toggle:hover { background: #f4f2ee; }
.glow-user-card { background: var(--g-white); border-radius: 12px; padding: 16px; gap: 12px; margin-bottom: 12px; position: relative; overflow: hidden; border: 1px solid rgba(74,144,226,0.08); box-shadow: 0 2px 12px rgba(74,144,226,0.06); }
.glow-user-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #4a90e2, #764ba2); opacity: 0.6; }
.user-avatar { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(74,144,226,0.2); }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 16px; font-weight: 600; }
.glow-menu-section { background: var(--g-white); border-radius: 10px; padding: 10px 0; margin-bottom: 12px; position: relative; overflow: hidden; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 1px 4px rgba(0,0,0,0.03); transition: box-shadow 0.3s, border-color 0.3s; }
.glow-menu-section:hover { box-shadow: 0 4px 16px rgba(74,144,226,0.08), 0 1px 4px rgba(0,0,0,0.03); border-color: rgba(74,144,226,0.1); }
.glow-menu-title { padding: 8px 16px; font-size: 12px; color: #999; text-transform: uppercase; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
.glow-menu-title:hover { color: #4a90e2; }
.glow-menu-item { padding: 10px 16px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; transition: all 0.25s; border-left: 3px solid transparent; position: relative; }
.glow-menu-item::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s; background: radial-gradient(ellipse at 50% 0%, rgba(74,144,226,0.04) 0%, transparent 70%); pointer-events: none; }
.glow-menu-item:hover { color: #4a90e2; padding-left: 20px; border-left-color: rgba(74,144,226,0.3); }
.glow-menu-item:hover::before { opacity: 1; }
.glow-menu-item--active { color: #4a90e2; font-weight: 600; background: rgba(74,144,226,0.05); border-left-color: #4a90e2; box-shadow: inset 3px 0 6px -3px rgba(74,144,226,0.2); }
.glow-menu-item .iconfont { font-size: 16px; }
.mycenter-content { flex: 1; background: var(--g-white); border-radius: 8px; padding: 24px; min-height: 500px; }
@media (max-width: 768px) {
  .mycenter-container { flex-direction: column; position: relative; min-height: calc(100vh - 200px); }
  .mycenter-sidebar-toggle { display: flex; position: sticky; top: 0; z-index: 10; }
  .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 98; }
  .mycenter-sidebar { position: fixed; top: 0; left: -240px; width: 240px; height: 100%; z-index: 99; display: flex; flex-direction: column; background: var(--g-bg); max-height: 100vh; overflow-y: auto; transition: left 0.3s ease; padding: 12px 0; margin: 0; }
  .mycenter-sidebar.open { left: 0; display: flex; }
  .mycenter-content { padding: 16px; min-height: auto; }
  .glow-menu-section { margin-bottom: 8px; background: var(--g-white); border-radius: 8px; padding: 10px 0; }
  .glow-user-card { margin: 0 12px 12px; }
}
</style>

