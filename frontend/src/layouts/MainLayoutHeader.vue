<template>
  <div class="ton-header">
    <div class="ton-header-top">
      <div class="ton-header-top-inner">
        <div class="ton-header-top-left">
          <a href="javascript:void(0)" @click="$router.push('/ordertracking')">Track Your Order</a>
          <a href="javascript:void(0)" @click="$router.push('/myorder')">Create A Return</a>
          <a href="javascript:void(0)" @click="$router.push('/rule')">Customer Care</a>
        </div>
        <div class="ton-header-top-right">
          <template v-if="!store.isLogin">
            <a href="/login" class="ton-header-signin">Sign In</a>
          </template>
          <template v-else>
            <span class="ton-header-user" @click="$router.push('/myaccount')">
              <i class="iconfont icon-yonghu"></i> {{ store.userInfo.username }}
            </span>
            <span class="ton-header-wallet" @click="$router.push('/balance')">
              ${{ store.walletBalance.toFixed(2) }}
            </span>
            <span class="ton-header-logout" @click="handleLogout">Logout</span>
          </template>
          <span class="ton-header-lang" @click="$router.push('/locales')">
            {{ currentLangName }}
          </span>
        </div>
      </div>
    </div>

    <div class="ton-header-main">
      <div class="ton-header-main-inner">
        <button class="ton-hamburger" @click="mobileMenuOpen = !mobileMenuOpen">&#9776;</button>
        <div class="ton-logo" @click="$router.push('/main')">
          THE OUTNET
        </div>
        <nav class="ton-nav desktop-only">
          <a href="/searchgoods">Just In</a>
          <a href="/searchgoods">Designers</a>
          <a href="/searchgoods">Clothing</a>
          <a href="/searchgoods">Shoes</a>
          <a href="/searchgoods">Bags</a>
          <a href="/searchgoods">Accessories</a>
        </nav>
        <div class="ton-header-actions">
          <button class="ton-header-icon" @click="$router.push('/searchgoods')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button class="ton-header-icon" @click="$router.push('/myaccount')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          </button>
          <button class="ton-header-icon" @click="$router.push('/car')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="ton-header-cart-count" v-if="store.carNum > 0">{{ store.carNum }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="ton-mobile-drawer-overlay" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = false"></div>
    <div class="ton-mobile-drawer" :class="{ open: mobileMenuOpen }">
      <div class="ton-drawer-header">
        <span v-if="store.isLogin">{{ store.userInfo.username }}</span>
        <span v-else @click="$router.push('/login'); mobileMenuOpen = false">Log in / Register</span>
        <button @click="mobileMenuOpen = false">&times;</button>
      </div>
      <div class="ton-drawer-search">
        <input v-model="keyword" type="text" placeholder="Search..." @keyup.enter="searchMobile" />
      </div>
      <div class="ton-drawer-items">
        <div class="ton-drawer-item" @click="goMobile('/main')">Home</div>
        <div class="ton-drawer-item" @click="goMobile('/tuijianlist')">Recommended</div>
        <div class="ton-drawer-item" @click="goMobile('/remenglist')">Popular</div>
        <div class="ton-drawer-item" @click="goMobile('/myorder')">My Orders</div>
        <div class="ton-drawer-item" @click="goMobile('/car')">Cart ({{ store.carNum }})</div>
        <div class="ton-drawer-item" @click="goMobile('/myaccount')">My Account</div>
        <div class="ton-drawer-divider"></div>
        <div class="ton-drawer-item" v-if="store.isLogin" @click="handleLogoutMobile">Logout</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()
const keyword = ref('')
const mobileMenuOpen = ref(false)

const langNames = { 'en': 'English', 'zh-CN': '简体中文', 'de': 'Deutsch', 'fr': 'Français', 'ja': '日本語', 'es': 'español', 'vi': 'Tiếng Việt' }
const currentLangName = computed(() => langNames[store.lang] || 'English')

const goMobile = (path) => { mobileMenuOpen.value = false; router.push(path) }
const searchMobile = () => {
  if (keyword.value.trim()) { mobileMenuOpen.value = false; router.push('/searchgoods?keyword=' + encodeURIComponent(keyword.value.trim())) }
}
const handleLogout = () => { store.logout(); router.push('/login'); ElMessage.success('Logged out') }
const handleLogoutMobile = () => { mobileMenuOpen.value = false; store.logout(); router.push('/login'); ElMessage.success('Logged out') }
</script>

<style scoped>
.ton-header { width: 100%; z-index: 1000; position: sticky; top: 0; }
.ton-header-top { background: #faf8f4; border-bottom: 1px solid #e8e6e2; }
.ton-header-top-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 20px; }
.ton-header-top-left { display: flex; align-items: center; gap: 20px; }
.ton-header-top-left a { font-size: 11px; color: #555; letter-spacing: 0.3px; }
.ton-header-top-left a:hover { color: #000; text-decoration: underline; }
.ton-header-top-right { display: flex; align-items: center; gap: 16px; }
.ton-header-top-right a, .ton-header-top-right span { font-size: 11px; color: #555; cursor: pointer; }
.ton-header-top-right a:hover, .ton-header-top-right span:hover { color: #000; }
.ton-header-signin { font-weight: 600; }
.ton-header-user { display: flex; align-items: center; gap: 4px; }
.ton-header-user .iconfont { font-size: 14px; }
.ton-header-wallet { color: #b8922a !important; font-weight: 600; }
.ton-header-logout { color: #c0392b !important; }
.ton-header-lang { cursor: pointer; padding: 0 8px; border-left: 1px solid #e8e6e2; }

.ton-header-main { background: #ffffff; border-bottom: 1px solid #e8e6e2; }
.ton-header-main-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 64px; padding: 0 20px; }
.ton-hamburger { display: none; font-size: 22px; cursor: pointer; background: none; border: none; padding: 0; margin-right: 16px; color: #000; }
.ton-logo { font-size: 20px; font-weight: 700; letter-spacing: 3px; cursor: pointer; white-space: nowrap; margin-right: 40px; }
.ton-nav { display: flex; align-items: center; gap: 28px; flex: 1; }
.ton-nav a { font-size: 12px; letter-spacing: 1px; color: #000; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
.ton-nav a:hover { opacity: 0.6; }
.ton-header-actions { display: flex; align-items: center; gap: 12px; }
.ton-header-icon { position: relative; background: none; border: none; cursor: pointer; padding: 6px; color: #000; display: flex; align-items: center; }
.ton-header-icon:hover { opacity: 0.6; }
.ton-header-cart-count { position: absolute; top: 0; right: 0; background: #000; color: #fff; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.ton-mobile-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998; display: none; }
.ton-mobile-drawer-overlay.open { display: block; }
.ton-mobile-drawer { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #fff; z-index: 999; transition: left 0.3s ease; overflow-y: auto; }
.ton-mobile-drawer.open { left: 0; }
.ton-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e8e6e2; font-weight: 600; font-size: 14px; }
.ton-drawer-header button { font-size: 24px; background: none; border: none; cursor: pointer; }
.ton-drawer-search { padding: 12px 16px; border-bottom: 1px solid #e8e6e2; }
.ton-drawer-search input { width: 100%; height: 36px; padding: 0 12px; border: 1px solid #e8e6e2; font-size: 14px; }
.ton-drawer-items { padding: 4px 0; }
.ton-drawer-item { padding: 12px 16px; cursor: pointer; font-size: 14px; color: #000; }
.ton-drawer-item:hover { background: #f4f2ee; }
.ton-drawer-divider { height: 1px; background: #e8e6e2; margin: 4px 16px; }

@media (max-width: 768px) {
  .ton-hamburger { display: flex; align-items: center; }
  .ton-nav { display: none; }
  .ton-header-top { display: none; }
}
</style>
