<template>
  <div class="ton-header">
    <div class="ton-header-top">
      <div class="ton-header-top-inner">
        <div class="ton-header-top-left">
          <el-dropdown trigger="click" class="ton-header-lang-dropdown ton-header-lang-top" @command="handleLangChange">
            <span class="ton-header-lang ton-header-lang-labeled">
              <span class="ton-header-lang-prefix">{{ $t('mainLayoutHeader.languageLabel') }}:</span>
              <span class="ton-header-lang-current">{{ currentLangName }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <el-dropdown-menu>
              <el-dropdown-item v-for="l in store.langList" :key="l.code" :command="l.code" :class="{ active: store.lang === l.code }">{{ l.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <span class="ton-header-top-divider"></span>
          <a href="javascript:void(0)" @click="$router.push('/ordertracking')">Track Your Order</a>
          <a href="javascript:void(0)" @click="$router.push('/myorder')">Create A Return</a>
          <a href="javascript:void(0)" @click="$router.push('/contact-us')">Customer Care</a>
          <a href="javascript:void(0)" @click="$router.push('/download-app')">Download the App</a>
        </div>
        <div class="ton-header-top-right">
          <template v-if="!store.isLogin">
            <a href="javascript:void(0)" class="ton-header-signin" @click="$router.push('/login')">Sign In</a>
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
          <el-dropdown trigger="click" class="ton-header-lang-dropdown ton-header-lang-compact" @command="handleLangChange">
            <span class="ton-header-lang ton-header-lang-icon" :title="currentLangName" aria-label="Language">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <el-dropdown-menu>
              <el-dropdown-item v-for="l in store.langList" :key="l.code" :command="l.code" :class="{ active: store.lang === l.code }">{{ l.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div class="ton-header-main">
      <div class="ton-header-main-inner">
        <button class="ton-hamburger" @click="mobileMenuOpen = !mobileMenuOpen">&#9776;</button>
        <div class="ton-logo" @click="$router.push('/main')">
          <img src="/img/outnet-logo.png" alt="THE OUTNET" class="ton-logo-img" />
        </div>
        <nav class="ton-nav desktop-only">
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Just In</a>
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Designers</a>
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Clothing</a>
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Shoes</a>
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Bags</a>
          <a href="javascript:void(0)" @click="$router.push('/searchgoods')">Accessories</a>
        </nav>
        <div class="ton-header-actions">
          <button class="ton-header-icon" @click="$router.push('/searchgoods')" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button class="ton-header-icon" @click="$router.push('/myaccount')" aria-label="Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          </button>
          <button class="ton-header-icon" @click="$router.push('/car')" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="ton-header-cart-count" v-if="store.carNum > 0">{{ store.carNum }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer -->
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
        <div class="ton-drawer-item" @click="$router.push('/main'); mobileMenuOpen = false">Home</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Just In</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Designers</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Clothing</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Shoes</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Bags</div>
        <div class="ton-drawer-item" @click="$router.push('/searchgoods'); mobileMenuOpen = false">Accessories</div>
        <div class="ton-drawer-divider"></div>
        <div class="ton-drawer-item ton-drawer-lang">
          <span class="ton-drawer-lang-label">{{ $t('mainLayoutHeader.languageLabel') }}:</span>
          <el-dropdown trigger="click" class="ton-drawer-lang-dropdown" @command="handleMobileLangChange">
            <span class="ton-drawer-lang-current">{{ currentLangName }} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
            <el-dropdown-menu>
              <el-dropdown-item v-for="l in store.langList" :key="l.code" :command="l.code" :class="{ active: store.lang === l.code }">{{ l.name }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <div class="ton-drawer-item" @click="$router.push('/about-us'); mobileMenuOpen = false">About THE OUTNET</div>
        <div class="ton-drawer-item" @click="$router.push('/contact-us'); mobileMenuOpen = false">Customer Care</div>
        <div class="ton-drawer-item" @click="$router.push('/faq'); mobileMenuOpen = false">FAQ</div>
        <div class="ton-drawer-item" @click="$router.push('/download-app'); mobileMenuOpen = false">Download the App</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get, post, qe } from '@/api/request'
import { ElMessage } from 'element-plus'
import i18n from '@/locales'

const router = useRouter()
const store = useAppStore()
const mobileMenuOpen = ref(false)
const keyword = ref('')

const currentLangName = computed(() => {
  const lang = store.langList?.find(l => l.code === store.lang)
  return lang?.name || 'English'
})

const handleLangChange = (code) => {
  store.setLanguage(code)
  i18n.global.locale.value = code
  window.location.reload()
}

const handleMobileLangChange = (code) => {
  mobileMenuOpen.value = false
  handleLangChange(code)
}

const searchMobile = () => {
  if (keyword.value.trim()) {
    router.push({ path: '/searchgoods', query: { keyword: keyword.value } })
    mobileMenuOpen.value = false
  }
}

const handleLogout = async () => {
  await post('/home/auth/logout').catch(() => {})
  store.logout()
  ElMessage.success('Logged out')
  router.push('/main')
}

watch(() => store.lang, () => {
  window.location.reload()
})
</script>

<style scoped>
.ton-header { width: 100%; z-index: 1000; position: sticky; top: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.ton-header-top { background: #faf8f4; border-bottom: 1px solid #e8e6e2; }
.ton-header-top-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 20px; }
.ton-header-top-left { display: flex; align-items: center; gap: 20px; }
.ton-header-top-left a { font-size: 11px; color: #555; letter-spacing: 0.3px; text-decoration: none; cursor: pointer; }
.ton-header-top-left a:hover { color: #000; text-decoration: underline; }
.ton-header-top-right { display: flex; align-items: center; gap: 16px; }
.ton-header-top-right a, .ton-header-top-right span { font-size: 11px; color: #555; cursor: pointer; }
.ton-header-top-right a:hover, .ton-header-top-right span:hover { color: #000; }
.ton-header-signin { font-weight: 600; }
.ton-header-user { display: flex; align-items: center; gap: 4px; }
.ton-header-user .iconfont { font-size: 14px; }
.ton-header-wallet { color: #b8922a !important; font-weight: 600; }
.ton-header-logout { color: #c0392b !important; }
.ton-header-lang { cursor: pointer; padding: 0 8px; border-left: 1px solid #e8e6e2; display: flex; align-items: center; gap: 4px; }
.ton-header-lang-dropdown { cursor: pointer; }
.ton-header-lang-top { margin-right: 4px; }
.ton-header-lang-labeled { border-left: 1px solid #e8e6e2; padding-left: 10px; }
.ton-header-lang-prefix { color: #888; font-size: 11px; letter-spacing: 0.3px; }
.ton-header-lang-current { color: #000; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
.ton-header-top-divider { width: 1px; height: 14px; background: #e8e6e2; margin: 0 4px; }
.ton-header-lang-compact .ton-header-lang-icon { padding: 0 6px; gap: 2px; }
.ton-header-lang-compact .ton-header-lang-icon svg { display: block; }

.ton-header-main { background: #ffffff; border-bottom: 1px solid #e8e6e2; }
.ton-header-main-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 64px; padding: 0 20px; }
.ton-hamburger { display: none; font-size: 22px; cursor: pointer; background: none; border: none; padding: 0; margin-right: 16px; color: #000; }
.ton-logo { cursor: pointer; white-space: nowrap; margin-right: 40px; display: flex; align-items: center; }
.ton-logo-img { height: 28px; width: auto; display: block; }
.ton-nav { display: flex; align-items: center; gap: 28px; flex: 1; }
.ton-nav a { font-size: 12px; letter-spacing: 1.2px; color: #000; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; text-decoration: none; font-weight: 400; }
.ton-nav a:hover { opacity: 0.5; }
.ton-header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.ton-header-icon { position: relative; background: none; border: none; cursor: pointer; padding: 6px; color: #000; display: flex; align-items: center; }
.ton-header-icon:hover { opacity: 0.5; }
.ton-header-cart-count { position: absolute; top: 0; right: 0; background: #000; color: #fff; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.ton-mobile-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998; display: none; }
.ton-mobile-drawer-overlay.open { display: block; }
.ton-mobile-drawer { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #fff; z-index: 999; transition: left 0.3s ease; overflow-y: auto; }
.ton-mobile-drawer.open { left: 0; }
.ton-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e8e6e2; font-weight: 600; font-size: 14px; }
.ton-drawer-header button { font-size: 24px; background: none; border: none; cursor: pointer; }
.ton-drawer-search { padding: 12px 16px; border-bottom: 1px solid #e8e6e2; }
.ton-drawer-search input { width: 100%; height: 36px; padding: 0 12px; border: 1px solid #e8e6e2; font-size: 14px; outline: none; box-sizing: border-box; }
.ton-drawer-items { padding: 4px 0; }
.ton-drawer-item { padding: 12px 16px; cursor: pointer; font-size: 14px; color: #000; }
.ton-drawer-item:hover { background: #f4f2ee; }
.ton-drawer-divider { height: 1px; background: #e8e6e2; margin: 4px 16px; }
.ton-drawer-lang { display: flex; align-items: center; gap: 8px; }
.ton-drawer-lang-label { color: #888; font-size: 13px; }
.ton-drawer-lang-current { color: #000; font-size: 13px; font-weight: 600; cursor: pointer; }

@media (max-width: 768px) {
  .ton-hamburger { display: flex; align-items: center; }
  .ton-nav { display: none; }
  .ton-header-top { display: none; }
}</style>
