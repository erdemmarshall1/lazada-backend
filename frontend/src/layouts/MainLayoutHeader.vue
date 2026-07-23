<template>
  <div class="ton-header">
    <div class="ton-header-top">
      <div class="ton-header-top-inner">
        <div class="ton-header-top-left">
          <span class="ton-header-top-divider"></span>
          <a href="javascript:void(0)" @click="$router.push('/ordertracking')">{{ $t('layout.header.trackOrder') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/myorder')">{{ $t('layout.header.createReturn') }}</a>
          <a href="javascript:void(0)" @click="openCustomerCare">{{ $t('layout.header.customerCare') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/download-app')">{{ $t('layout.header.downloadApp') }}</a>
        </div>
        <div class="ton-header-top-right">
          <template v-if="!store.isLogin">
            <a href="javascript:void(0)" class="ton-header-signin" @click="$router.push('/login')">{{ $t('layout.header.signIn') }}</a>
          </template>
          <template v-else>
            <span class="ton-header-user" @click="$router.push('/myaccount')">
              <i class="iconfont icon-yonghu"></i> {{ store.userInfo?.username }}
            </span>
            <span class="ton-header-wallet" @click="$router.push('/balance')">
              ${{ store.walletBalance.toFixed(2) }}
            </span>
            <span class="ton-header-logout" @click="handleLogout">{{ $t('layout.header.logout') }}</span>
          </template>

        </div>
      </div>
    </div>

    <div class="ton-header-main">
      <div class="ton-header-main-inner">
        <button class="ton-hamburger" @click="mobileMenuOpen = !mobileMenuOpen">&#9776;</button>
        <div class="ton-logo" @click="$router.push('/main')">
          <img src="/img/outnet-logo.png" :alt="$t('layout.header.logoAlt')" class="ton-logo-img" />
        </div>
        <nav class="ton-nav desktop-only">
          <a href="javascript:void(0)" @click="$router.push('/just-in')">{{ $t('layout.header.justIn') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/designers')">{{ $t('layout.header.designers') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/categories/clothing')">{{ $t('layout.header.clothing') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/categories/shoes')">{{ $t('layout.header.shoes') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/categories/bags')">{{ $t('layout.header.bags') }}</a>
          <a href="javascript:void(0)" @click="$router.push('/categories/accessories')">{{ $t('layout.header.accessories') }}</a>
        </nav>
        <div class="ton-header-actions">
          <button class="ton-header-icon" @click="$router.push('/searchgoods')" :aria-label="$t('layout.header.searchAria')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button class="ton-header-icon" @click="$router.push('/myaccount')" :aria-label="$t('layout.header.accountAria')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
          </button>
          <NotificationBell v-if="store.isLogin" />
          <button class="ton-header-icon" @click="$router.push('/car')" :aria-label="$t('layout.header.cartAria')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="ton-header-cart-count" v-if="store.carNum > 0">{{ store.carNum }}</span>
          </button>
          <el-dropdown trigger="click" class="ton-header-lang-btn" @command="handleLangChange">
            <button class="ton-header-icon" :aria-label="$t('layout.header.languageAria')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="l in store.langList" :key="l.code" :command="l.code" :class="{ active: store.lang === l.code }">{{ l.name }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div class="ton-mobile-drawer-overlay" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = false"></div>
    <div class="ton-mobile-drawer" :class="{ open: mobileMenuOpen }">
      <div class="ton-drawer-header">
        <span v-if="store.isLogin">{{ store.userInfo?.username }}</span>
        <span v-else @click="$router.push('/login'); mobileMenuOpen = false">{{ $t('layout.header.loginRegister') }}</span>
        <button @click="mobileMenuOpen = false">&times;</button>
      </div>
      <div class="ton-drawer-search">
        <input v-model="keyword" type="text" :placeholder="$t('layout.header.searchPlaceholder')" @keyup.enter="searchMobile" />
      </div>
      <div class="ton-drawer-items">
        <div class="ton-drawer-item" @click="$router.push('/main'); mobileMenuOpen = false"><i class="iconfont icon-shouye"></i> {{ $t('layout.header.home') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/just-in'); mobileMenuOpen = false"><i class="iconfont icon-31sousuo"></i> {{ $t('layout.header.justIn') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/designers'); mobileMenuOpen = false"><i class="iconfont icon-ziyuanxhdpi"></i> {{ $t('layout.header.designers') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/categories/clothing'); mobileMenuOpen = false"><i class="iconfont icon-fenlei"></i> {{ $t('layout.header.clothing') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/categories/shoes'); mobileMenuOpen = false"><i class="iconfont icon-fenlei"></i> {{ $t('layout.header.shoes') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/categories/bags'); mobileMenuOpen = false"><i class="iconfont icon-fenlei"></i> {{ $t('layout.header.bags') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/categories/accessories'); mobileMenuOpen = false"><i class="iconfont icon-fenlei"></i> {{ $t('layout.header.accessories') }}</div>
        <div class="ton-drawer-divider"></div>
        <div class="ton-drawer-item" @click="$router.push('/remenglist'); mobileMenuOpen = false"><i class="iconfont icon-jiangbei"></i> {{ $t('layout.header.bestsellers') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/tuijianlist'); mobileMenuOpen = false"><i class="iconfont icon-shoucang1"></i> {{ $t('layout.header.recommended') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/shopjie'); mobileMenuOpen = false"><i class="iconfont icon-dianpu"></i> {{ $t('layout.header.shopStreet') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/miaoshalist'); mobileMenuOpen = false"><i class="iconfont icon-tiantianquan"></i> {{ $t('layout.header.flashDeals') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/secondsort'); mobileMenuOpen = false"><i class="iconfont icon-fenlei"></i> {{ $t('layout.header.categories') }}</div>
        <div class="ton-drawer-divider"></div>
        <div class="ton-drawer-item" @click="$router.push('/about-us'); mobileMenuOpen = false"><i class="iconfont icon-bangzhu"></i> {{ $t('layout.header.about') }}</div>
        <div class="ton-drawer-item" @click="openCustomerCareMobile"><i class="iconfont icon-kefu"></i> {{ $t('layout.header.customerCare') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/faq'); mobileMenuOpen = false"><i class="iconfont icon-bangzhu"></i> {{ $t('layout.header.faq') }}</div>
        <div class="ton-drawer-item" @click="$router.push('/download-app'); mobileMenuOpen = false"><i class="iconfont icon-xiazai"></i> {{ $t('layout.header.downloadApp') }}</div>
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
import i18n, { isValidLang, t } from '@/locales'
import NotificationBell from '@/components/NotificationBell.vue'

const router = useRouter()
const store = useAppStore()
const mobileMenuOpen = ref(false)
const keyword = ref('')

const currentLangName = computed(() => {
  const lang = store.langList?.find(l => l.code === store.lang)
  return lang?.name || 'English'
})

const handleLangChange = (code) => {
  if (code === store.lang) return
  if (!isValidLang(code)) return
  store.setLanguage(code)
  i18n.global.locale.value = code
  window.location.reload()
}

const searchMobile = () => {
  if (keyword.value.trim()) {
    router.push({ path: '/searchgoods', query: { keyword: keyword.value } })
    mobileMenuOpen.value = false
  }
}

const openTawkto = () => {
  if (window.Tawk_API && store.tawkTo.enabled) {
    window.Tawk_API.maximize()
  }
}

const openCustomerCare = () => {
  router.push('/contact-us')
  setTimeout(() => openTawkto(), 500)
}

const openCustomerCareMobile = () => {
  mobileMenuOpen.value = false
  router.push('/contact-us')
  setTimeout(() => openTawkto(), 500)
}

const handleLogout = async () => {
  await post('/home/auth/logout').catch(() => {})
  store.logout()
  ElMessage.success(t('layout.header.logout'))
  router.push('/main')
}

watch(() => store.lang, () => {
  window.location.reload()
})

watch(mobileMenuOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
</script>

<style scoped>
.ton-header { width: 100%; z-index: 1000; position: sticky; top: 0; font-family: 'TheOutnetWebXL', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; }
.ton-header-top { background: #ffffff; border-bottom: 1px solid #e9e9e9; }
.ton-header-top-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 20px; }
.ton-header-top-left { display: flex; align-items: center; gap: 20px; }
.ton-header-top-left a { font-size: 11px; color: #666; letter-spacing: 0.3px; text-decoration: none; cursor: pointer; }
.ton-header-top-left a:hover { color: #192537; text-decoration: underline; }
.ton-header-top-right { display: flex; align-items: center; gap: 16px; }
.ton-header-top-right a, .ton-header-top-right span { font-size: 11px; color: #666; cursor: pointer; }
.ton-header-top-right a:hover, .ton-header-top-right span:hover { color: #192537; }
.ton-header-signin { font-weight: 600; }
.ton-header-user { display: flex; align-items: center; gap: 4px; }
.ton-header-user .iconfont { font-size: 14px; }
.ton-header-wallet { color: #ee4d2d !important; font-weight: 600; }
.ton-header-logout { color: #f56c6c !important; }
.ton-header-top-divider { width: 1px; height: 14px; background: #e9e9e9; margin: 0 4px; }
.ton-header-lang-btn { cursor: pointer; display: flex; align-items: center; }

.ton-header-main { background: #ffffff; border-bottom: 1px solid #e9e9e9; }
.ton-header-main-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 64px; padding: 0 20px; }
.ton-hamburger { display: none; font-size: 22px; cursor: pointer; background: none; border: none; padding: 0; margin-right: 16px; color: #192537; }
.ton-logo { cursor: pointer; white-space: nowrap; margin-right: 40px; display: flex; align-items: center; }
.ton-logo-img { height: 36px; width: auto; display: block; }
.ton-nav { display: flex; align-items: center; gap: 28px; flex: 1; }
.ton-nav a { font-size: 12px; letter-spacing: 1.5px; color: #192537; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; text-decoration: none; font-weight: 700; }
.ton-nav a:hover { opacity: 0.5; }
.ton-header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.ton-header-icon { position: relative; background: none; border: none; cursor: pointer; padding: 6px; color: #192537; display: flex; align-items: center; }
.ton-header-icon:hover { opacity: 0.5; }
.ton-header-cart-count { position: absolute; top: 0; right: 0; background: #ee4d2d; color: #fff; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.ton-mobile-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998; display: none; }
.ton-mobile-drawer-overlay.open { display: block; }
.ton-mobile-drawer { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #fff; z-index: 999; transition: left 0.3s ease; overflow-y: auto; }
.ton-mobile-drawer.open { left: 0; }
.ton-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e9e9e9; font-weight: 600; font-size: 14px; background: #192537; color: #fff; }
.ton-drawer-header button { font-size: 24px; background: none; border: none; cursor: pointer; color: #fff; }
.ton-drawer-search { padding: 12px 16px; border-bottom: 1px solid #e9e9e9; }
.ton-drawer-search input { width: 100%; height: 36px; padding: 0 12px; border: 1px solid #e9e9e9; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; border-radius: 6px; }
.ton-drawer-search input:focus { border-color: rgba(10,104,255,0.4); box-shadow: 0 0 8px rgba(10,104,255,0.1); }
.ton-drawer-items { padding: 4px 0; }
.ton-drawer-item { padding: 12px 16px; cursor: pointer; font-size: 14px; color: #192537; transition: all 0.25s; border-left: 3px solid transparent; position: relative; min-height: 44px; display: flex; align-items: center; }
.ton-drawer-item::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s; background: radial-gradient(ellipse at 50% 0%, rgba(238,77,45,0.04) 0%, transparent 70%); pointer-events: none; }
.ton-drawer-item:hover { background: rgba(238,77,45,0.04); border-left-color: rgba(238,77,45,0.3); padding-left: 19px; }
.ton-drawer-item:hover::before { opacity: 1; }
.ton-drawer-divider { height: 1px; background: #e9e9e9; margin: 4px 16px; }
.ton-drawer-item i { margin-right: 10px; font-size: 16px; }
@media (max-width: 768px) {
  .ton-hamburger { display: flex; align-items: center; }
  .ton-nav { display: none; }
  .ton-header-top { display: none; }
  .ton-header-main-inner { height: 56px; padding: 0 12px; }
  .ton-logo-img { height: 28px; }
  .ton-logo { margin-right: 0; }
  .ton-header-actions { gap: 8px; }
  .ton-header-icon { min-width: 44px; min-height: 44px; justify-content: center; }
}</style>
