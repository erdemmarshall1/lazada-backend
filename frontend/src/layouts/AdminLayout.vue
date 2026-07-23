<template>
  <div class="admin-layout">
    <div class="admin-sidebar" :class="{ collapsed: sidebarCollapsed, mobileOpen: mobileSidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">A</span>
          <span class="logo-text" v-show="!sidebarCollapsed">{{ $t('layout.admin.panel') }}</span>
        </div>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          <i class="iconfont icon-zhankaimulu"></i>
        </button>
      </div>
      <div class="sidebar-menu">
        <div v-for="group in menuGroups" :key="group.title" class="menu-group">
          <div class="menu-group-title admin-glow-section" @click="toggleGroup(group.title)">
            <i :class="group.icon"></i>
            <span v-show="!sidebarCollapsed">{{ group.title }}</span>
            <i v-show="!sidebarCollapsed" class="menu-arrow" :class="{ rotated: !isGroupCollapsed(group.title) }">&#9654;</i>
          </div>
          <div class="menu-items" v-show="!isGroupCollapsed(group.title)">
            <div
              v-for="item in group.items.filter(i => !i.adminOnly || adminStore.isAdmin)"
              :key="item.path"
              class="menu-item admin-glow-item"
              :class="{ active: isActive(item.path), 'admin-glow-item--active': isActive(item.path) }"
              @click="navigate(item.path)"
              :title="sidebarCollapsed ? item.label : ''"
            >
              <i :class="item.icon"></i>
              <span v-show="!sidebarCollapsed">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="sidebar-footer admin-footer-glow" v-show="!sidebarCollapsed" v-if="adminStore.isLogin">
        <div class="user-info admin-user-card" style="cursor:pointer" @click="$router.push('/admin/dashboard')">
          <div class="user-avatar">{{ adminStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'A' }}</div>
          <div class="user-details">
            <div class="user-name">{{ adminStore.userInfo?.username || 'Admin' }}</div>
            <div class="user-role">{{ $t('layout.admin.administrator') }}</div>
          </div>
        </div>
        <div class="sidebar-footer-actions">
          <button class="footer-action-btn" :title="$t('layout.admin.downloadAppTitle')" @click="$router.push('/download-app')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v14m0 0l-4-4m4 4l4-4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
          </button>
          <button class="logout-btn" @click="handleLogout">
            <i class="iconfont icon-tuichu"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="admin-main">
      <div class="admin-topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" @click="mobileSidebarOpen = !mobileSidebarOpen">
            <i class="iconfont icon-cedaohang-kehuguanli"></i>
          </button>
          <div class="breadcrumb">
            <span v-for="(crumb, idx) in breadcrumbs" :key="idx">
              <span v-if="idx > 0" class="breadcrumb-sep">/</span>
              <span class="breadcrumb-item" :class="{ active: idx === breadcrumbs.length - 1 }">{{ crumb }}</span>
            </span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-search">
            <i class="iconfont icon-31sousuo"></i>
            <input v-model="searchQuery" :placeholder="$t('layout.admin.searchPlaceholder')" @keyup.enter="handleSearch" />
          </div>
          <div class="topbar-notif">
            <NotificationBell />
          </div>
          <el-dropdown trigger="click" class="topbar-lang-btn" @command="handleLangChange">
            <div class="topbar-lang-trigger" :title="currentLangName" :aria-label="$t('layout.admin.languageAria')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="l in appStore.langList" :key="l.code" :command="l.code" :class="{ active: appStore.lang === l.code }">{{ l.name }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click">
            <div class="topbar-user">
              <span class="user-avatar-small">{{ adminStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'A' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/admin/dashboard')">{{ $t('layout.admin.dashboard') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/admin/settings')">{{ $t('layout.admin.settings') }}</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">{{ $t('layout.admin.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="admin-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </div>
    </div>

    <div class="sidebar-overlay" v-if="mobileSidebarOpen" @click="mobileSidebarOpen = false"></div>
    <PwaInstallBanner mode="popup" />
    <PwaInstallTour ref="tourRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAppStore } from '@/stores/adminApp'
import { useAppStore } from '@/stores/app'
import { adminPost } from '@/api/adminRequest'
import i18n, { isValidLang } from '@/locales'
import { connectSocket, joinUser } from '@/socket'

import NotificationBell from '@/components/NotificationBell.vue'
import PwaInstallBanner from '@/components/PwaInstallBanner.vue'
import PwaInstallTour from '@/components/PwaInstallTour.vue'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminAppStore()
const appStore = useAppStore()

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const searchQuery = ref('')
const collapsedGroups = ref(new Set())
const tourRef = ref(null)

const currentLangName = computed(() => {
  const lang = appStore.langList?.find(l => l.code === appStore.lang)
  return lang?.name || 'English'
})

const handleLangChange = (code) => {
  if (code === appStore.lang) return
  if (!isValidLang(code)) return
  appStore.setLanguage(code)
  i18n.global.locale.value = code
  window.location.reload()
}

const toggleGroup = (title) => {
  if (collapsedGroups.value.has(title)) {
    collapsedGroups.value.delete(title)
  } else {
    collapsedGroups.value.add(title)
  }
}
const isGroupCollapsed = (title) => collapsedGroups.value.has(title)

const isActive = (path) => route.path === path
const navigate = (path) => {
  router.push(path)
  mobileSidebarOpen.value = false
}

const handleLogout = async () => {
  await adminPost('/home/admin/auth/logout').catch(() => {})
  adminStore.logout()
  router.push('/admin')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push('/admin/users')
  }
}

const breadcrumbs = computed(() => {
  const path = route.path
  const parts = path.split('/').filter(Boolean)
  return parts.map(p => {
    const labels = {
      admin: 'Admin', dashboard: 'Dashboard', users: 'Users',
      sellers: 'Sellers', products: 'Products', transactions: 'Transactions',
      coupons: 'Coupons', banners: 'Banners', 'invitation-codes': 'Invitation Codes',
      reviews: 'Reviews', roles: 'Roles & Permissions',
      'cms-pages': 'CMS Pages', 'cms-blogs': 'CMS Blogs', 'cms-faqs': 'CMS FAQs',
      'cms-menus': 'CMS Menus', reports: 'Reports',
      'payment-settings': 'Payment Settings', 'email-settings': 'Email Settings',
      'theme-settings': 'Theme Settings', balance: 'Balance Mgmt',
      'platform-wallet': 'Platform Wallet', 'sessions-audit': 'Sessions & Audit',
      settings: 'Settings', 'homepage-sections': 'Homepage Sections',
      submissions: 'Inquiries', 'tawkto-settings': 'Tawk.to Chat',
      'livechat-inbox': 'Live Chat Inbox', 'livechat-settings': 'Live Chat Settings',
      'user-privacy': 'User Privacy', 'user-detail': 'User Detail',
      'shop-detail': 'Shop Detail', logistics: 'Logistics', 'superadmin-dashboard': 'Super Admin',
    }
    return labels[p] || p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
  })
})

const menuGroups = computed(() => [
  {
    title: 'Dashboard', icon: 'iconfont icon-dashboard',
    items: [
      { icon: 'iconfont icon-dashboard', label: 'Dashboard', path: '/admin/dashboard' },
      { icon: 'iconfont icon-zhuzhuangtu', label: 'Reports', path: '/admin/reports' },
    ]
  },
  {
    title: 'Commerce', icon: 'iconfont icon-shangpin',
    items: [
      { icon: 'iconfont icon-yonghu', label: 'Users', path: '/admin/users' },
      { icon: 'iconfont icon-dianpu', label: 'Sellers', path: '/admin/sellers' },
      { icon: 'iconfont icon-shangpin', label: 'Products', path: '/admin/products' },
      { icon: 'iconfont icon-coupon', label: 'Coupons', path: '/admin/coupons' },
      { icon: 'iconfont icon-daifahuo', label: 'Logistics', path: '/admin/logistics' },
      { icon: 'iconfont icon-anquan', label: 'Invitation Codes', path: '/admin/invitation-codes' },
      { icon: 'iconfont icon-xingxing', label: 'Reviews', path: '/admin/reviews' },
    ]
  },
  {
    title: 'Finance', icon: 'iconfont icon-qianbao',
    items: [
      { icon: 'iconfont icon-jiaoyi', label: 'Transactions', path: '/admin/transactions' },
      { icon: 'iconfont icon-qianbao', label: 'Balance Mgmt', path: '/admin/balance' },
      { icon: 'iconfont icon-yue', label: 'Platform Wallet', path: '/admin/platform-wallet' },
    ]
  },
  {
    title: 'Content', icon: 'iconfont icon-tupian',
    items: [
      { icon: 'iconfont icon-tupian', label: 'Banners', path: '/admin/banners' },
      { icon: 'iconfont icon-shangpin', label: 'CMS Pages', path: '/admin/cms-pages' },
      { icon: 'iconfont icon-shangpin', label: 'CMS Blogs', path: '/admin/cms-blogs' },
      { icon: 'iconfont icon-shangpin', label: 'CMS FAQs', path: '/admin/cms-faqs' },
      { icon: 'iconfont icon-shangpin', label: 'CMS Menus', path: '/admin/cms-menus' },
      { icon: 'iconfont icon-shangpin', label: 'Homepage Sections', path: '/admin/homepage-sections' },
    ]
  },
  {
    title: 'Communication', icon: 'iconfont icon-xiaoxi',
    items: [
      { icon: 'iconfont icon-xinxi', label: 'Inquiries', path: '/admin/submissions' },
      { icon: 'iconfont icon-kefu', label: 'Tawk.to Chat', path: '/admin/tawkto-settings' },
      { icon: 'iconfont icon-kefu', label: 'Live Chat Inbox', path: '/admin/livechat-inbox' },
      { icon: 'iconfont icon-shezhi', label: 'Live Chat Settings', path: '/admin/livechat-settings' },
    ]
  },
  {
    title: 'System', icon: 'iconfont icon-shezhi',
    items: [
      { icon: 'iconfont icon-shezhi', label: 'Payment Settings', path: '/admin/payment-settings' },
      { icon: 'iconfont icon-email', label: 'Email Settings', path: '/admin/email-settings' },
      { icon: 'iconfont icon-theme', label: 'Theme Settings', path: '/admin/theme-settings' },
      { icon: 'iconfont icon-anquan', label: 'Roles & Permissions', path: '/admin/roles' },
      { icon: 'iconfont icon-anquan', label: 'Sessions & Audit', path: '/admin/sessions-audit' },
      { icon: 'iconfont icon-shezhi', label: 'General Settings', path: '/admin/settings' },
      { icon: 'iconfont icon-anquan', label: 'Seller ID Settings', path: '/admin/seller-id-settings' },
      { icon: 'iconfont icon-dashboard', label: 'Super Admin', path: '/admin/superadmin-dashboard' },
    ]
  },
])

onMounted(() => {
  document.documentElement.classList.add('admin-active')
  const socket = connectSocket()
  if (adminStore.isLogin && adminStore.userInfo?._id) {
    joinUser(adminStore.userInfo?._id)
  }
  setTimeout(() => {
    if (tourRef.value) tourRef.value.show()
  }, 3000)
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('admin-active')
})
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; overflow: hidden; background: var(--dash-dark-bg); }
.sidebar-overlay { display: none; }
.admin-sidebar { width: 260px; min-width: 260px; background: var(--dash-dark-bg); color: #a0aec0; display: flex; flex-direction: column; transition: width 0.3s ease, min-width 0.3s ease; z-index: 100; }
.admin-sidebar.collapsed { width: 64px; min-width: 64px; }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.sidebar-logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
.logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; flex-shrink: 0; }
.logo-text { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; }
.sidebar-toggle { background: none; border: none; color: #6c7a8d; cursor: pointer; font-size: 18px; padding: 4px; border-radius: 4px; }
.sidebar-toggle:hover { color: #fff; background: rgba(255,255,255,0.06); }
.sidebar-menu { flex: 1; overflow-y: auto; padding: 8px 0; }
.sidebar-menu::-webkit-scrollbar { width: 4px; }
.sidebar-menu::-webkit-scrollbar-track { background: transparent; }
.sidebar-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.menu-group { margin-bottom: 2px; }
.menu-group-title { display: flex; align-items: center; gap: 12px; padding: 10px 16px; cursor: pointer; font-size: 11px; font-weight: 600; color: #6c7a8d; text-transform: uppercase; letter-spacing: 0.8px; transition: color 0.2s; user-select: none; }
.menu-group-title:hover { color: #a0aec0; }
.menu-group-title .iconfont { font-size: 14px; }
.menu-arrow { font-size: 8px; margin-left: auto; transition: transform 0.3s; color: #6c7a8d; }
.menu-arrow.rotated { transform: rotate(90deg); }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 9px 16px 9px 44px; cursor: pointer; font-size: 13px; color: #a0aec0; transition: all 0.2s; border-left: 3px solid transparent; }
.admin-sidebar.collapsed .menu-item { padding: 12px 0; justify-content: center; }
.menu-item:hover { color: #fff; background: rgba(255,255,255,0.04); }
.menu-item.active { color: #fff; background: rgba(102,126,234,0.12); border-left-color: #667eea; }
.menu-item .iconfont { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.menu-item span { white-space: nowrap; overflow: hidden; }
.admin-glow-item { position: relative; overflow: hidden; }
.admin-glow-item::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s; background: radial-gradient(ellipse at 50% 0%, rgba(102,126,234,0.08) 0%, transparent 70%); pointer-events: none; }
.admin-glow-item:hover::before { opacity: 1; }
.admin-glow-item:hover { border-left-color: rgba(102,126,234,0.4); }
.admin-glow-item--active { border-left-color: #667eea !important; box-shadow: 0 0 16px rgba(102,126,234,0.12), inset 3px 0 8px -3px rgba(102,126,234,0.2); }
.admin-glow-section { position: relative; }
.admin-glow-section:hover { color: #fff; }
.sidebar-footer { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: auto; flex-shrink: 0; }
.admin-footer-glow { position: relative; }
.admin-footer-glow::before { content: ''; position: absolute; top: 0; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, rgba(102,126,234,0.3), transparent); }
.user-info { display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden; }
.admin-user-card { padding: 4px; border-radius: 8px; }
.user-avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.user-details { overflow: hidden; }
.user-name { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 11px; color: #6c7a8d; }
.sidebar-footer-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.footer-action-btn { background: none; border: none; color: #6c7a8d; cursor: pointer; font-size: 16px; padding: 6px; border-radius: 4px; display: flex; align-items: center; }
.footer-action-btn:hover { color: #667eea; background: rgba(255,255,255,0.06); }
.logout-btn { background: none; border: none; color: #6c7a8d; cursor: pointer; font-size: 18px; padding: 6px; border-radius: 4px; display: flex; align-items: center; }
.logout-btn:hover { color: #e74c3c; background: rgba(255,255,255,0.06); }
.admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.admin-topbar { display: flex; align-items: center; justify-content: space-between; height: 60px; background: var(--dash-dark-card); padding: 0 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); z-index: 10; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.topbar-left { display: flex; align-items: center; gap: 16px; }
.hamburger-btn { display: none; background: none; border: none; font-size: 20px; cursor: pointer; color: rgba(255,255,255,0.5); padding: 4px; }
.hamburger-btn:hover { color: #fff; }
.breadcrumb { display: flex; align-items: center; gap: 4px; font-size: 13px; color: rgba(255,255,255,0.35); }
.breadcrumb-sep { color: rgba(255,255,255,0.15); margin: 0 2px; }
.breadcrumb-item.active { color: rgba(255,255,255,0.7); font-weight: 600; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.topbar-search { display: flex; align-items: center; gap: 8px; background: var(--dash-dark-card-alt); border-radius: 8px; padding: 6px 12px; width: 200px; transition: width 0.2s; border: 1px solid rgba(255,255,255,0.06); }
.topbar-search:focus-within { width: 260px; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
.topbar-search i { color: rgba(255,255,255,0.3); font-size: 14px; }
.topbar-search input { border: none; background: none; outline: none; font-size: 13px; color: rgba(255,255,255,0.7); width: 100%; }
.topbar-search input::placeholder { color: rgba(255,255,255,0.25); }
.topbar-notif { position: relative; cursor: pointer; font-size: 20px; color: rgba(255,255,255,0.5); padding: 4px; }
.topbar-notif:hover { color: #fff; }
.notif-badge { position: absolute; top: -2px; right: -4px; background: #e74c3c; color: #fff; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.topbar-user { cursor: pointer; }
.user-avatar-small { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.topbar-lang-btn { cursor: pointer; }
.topbar-lang-trigger { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; color: rgba(255,255,255,0.5); cursor: pointer; transition: color 0.2s, background 0.2s; }
.topbar-lang-trigger:hover { color: #fff; background: rgba(255,255,255,0.06); }
.admin-content { flex: 1; overflow-y: auto; }
.content-wrapper { padding: 24px; max-width: 1440px; }
@media (max-width: 1024px) {
  .admin-sidebar { position: fixed; left: -260px; top: 0; height: 100%; z-index: 200; }
  .admin-sidebar.mobileOpen { left: 0; }
  .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
  .hamburger-btn { display: flex; }
  .topbar-search { width: 140px; }
  .topbar-search:focus-within { width: 180px; }
  .content-wrapper { padding: 16px; }
}
</style>
