<template>
  <div class="s_layout_header">
    <div class="s-header-top-box desktop-only">
      <div class="s-header-top g-flex-align-center g-flex-justify-end">
        <div class="s-header-top-item-list g-flex-align-center">
          <template v-if="!store.isLogin">
            <div class="s-header-top-item g-flex-align-center">
              <div class="s-header-top-item-login"><span @click="$router.push('/login')">Log in</span></div>
              / <div class="s-header-top-item-login"><span @click="$router.push('/register')">Register</span></div>
            </div>
          </template>
          <template v-else>
              <div class="s-header-top-item g-flex-align-center" style="gap:8px">
                <div class="s-header-top-item-userinfo g-flex-align-center" @click="$router.push('/myaccount')">
                  <i class="iconfont icon-yonghu"></i>
                  <span class="s-header-top-item-userinfo-username">{{ store.userInfo.username }}</span>
                </div>
                <span class="wallet-balance" @click="$router.push('/balance')">
                  <i class="iconfont icon-qianbao"></i>
                  ${{ store.walletBalance.toFixed(2) }}
                </span>
                <span class="logout-btn" @click="handleLogout">Logout</span>
              </div>
          </template>
          <div class="s-header-top-item g-flex-align-center" @click="goTo('/myorder')">
            <span class="s-header-top-item-title">My Order</span>
          </div>
          <div class="s-header-top-item g-flex-align-center" @click="goTo('/car')">
            <i class="iconfont icon-gouwuche_o"></i>
            <span class="s-header-top-item-title">Shopping cart</span>
            <span class="s-header-top-item-val">({{ store.carNum }})</span>
          </div>
          <div class="s-header-top-item g-flex-align-center" @click="goTo('/main')">
            <span class="s-header-top-item-title">Front page</span>
          </div>
          <div class="s-header-top-item g-flex-align-center" @click="goTo('/chattostorelist')">
            <span class="s-header-top-item-title">My message</span>
            <span class="s-header-top-item-val">({{ store.userUnreadMsgNum }})</span>
          </div>
          <div class="s-header-top-item g-flex-align-center">
            <span class="s-header-top-item-title">Store news</span>
            <span class="s-header-top-item-val">({{ store.storeUnReadMsgNum }})</span>
          </div>
          <div class="s-header-top-item g-flex-align-center" @click="goTo('/internalmsg')">
            <span class="s-header-top-item-title">Site message</span>
          </div>
          <div class="s-header-top-item s-header-top-item-language-box g-flex-align-center">
            <el-popover trigger="hover" placement="bottom-start" :width="150">
              <template #reference>
                <div class="s-header-top-item-language-content g-flex-align-center">
                  <div class="s-header-top-item-language-icon g-flex-align-center">
                    <img src="data:image/png;base64,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" alt="" style="width:22px;height:22px">
                  </div>
                  <span class="s-header-top-item-language-text">{{ currentLangName }}</span>
                  <i class="iconfont icon-xiala"></i>
                </div>
              </template>
              </el-popover>
            </div>
          </div>
        </div>
      </div>
    <div class="s-header-bottom-box">
      <div class="s-header-bottom g-flex-align-center">
        <button class="hamburger-btn" @click="mobileMenuOpen = !mobileMenuOpen">&#9776;</button>
        <div class="s-header-bottom-left" @click="$router.push('/main')">
          <img src="/img/logo.svg" alt="Shopify Wholesale" style="height:40px">
        </div>
        <div class="s-header-bottom-center-box g-flex-align-center">
          <div class="s-header-bottom-center g-flex-align-center">
            <div class="s-header-bottom-input">
              <input v-model="keyword" type="text" :placeholder="searchPlaceholder" @keyup.enter="searchGoods" />
            </div>
            <div class="s-header-bottom-search-icon s-header-bottom-search-icon-one" @click="searchGoods">
              <i class="iconfont icon-sousuo_o"></i>
              <span class="desktop-only">Search Products</span>
            </div>
            <div class="s-header-bottom-search-icon s-header-bottom-search-icon-two desktop-only" @click="searchStore">
              <i class="iconfont icon-dianpu"></i>
              <span>Search Store</span>
            </div>
          </div>
        </div>
        <div class="s-headr-bottom-right g-flex-align-center" @click="$router.push('/car')">
          <i class="iconfont icon-gouwuche-tianchong"></i>
          <span class="s-headr-bottom-right-text">My Cart</span>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-drawer-overlay" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = false"></div>
  <div class="mobile-drawer" :class="{ open: mobileMenuOpen }">
    <div class="drawer-header">
      <span v-if="store.isLogin">{{ store.userInfo.username }}</span>
      <span v-else @click="$router.push('/login'); mobileMenuOpen = false">Log in / Register</span>
      <button class="hamburger-btn" @click="mobileMenuOpen = false">&times;</button>
    </div>
    <div class="drawer-search">
      <input v-model="keyword" type="text" placeholder="Search products..." @keyup.enter="searchGoodsMobile" />
    </div>
    <div class="drawer-items">
      <div class="drawer-item" @click="goToMobile('/main')"><i class="iconfont icon-fenlei"></i> Home</div>
      <div class="drawer-item" @click="goToMobile('/tuijianlist')"><i class="iconfont icon-tuijian"></i> Recommended</div>
      <div class="drawer-item" @click="goToMobile('/remenglist')"><i class="iconfont icon-huore"></i> Popular</div>
      <div class="drawer-item" @click="goToMobile('/shopjie')"><i class="iconfont icon-dianpu"></i> Shop Street</div>
      <div class="drawer-divider"></div>
      <div class="drawer-item" @click="goToMobile('/myorder')"><i class="iconfont icon-dingdan"></i> My Orders</div>
      <div class="drawer-item" @click="goToMobile('/car')"><i class="iconfont icon-gouwuche_o"></i> Cart ({{ store.carNum }})</div>
      <div class="drawer-item" @click="goToMobile('/chattostorelist')"><i class="iconfont icon-xiaoxi"></i> Messages ({{ store.userUnreadMsgNum }})</div>
      <div class="drawer-item" @click="goToMobile('/myaccount')"><i class="iconfont icon-yonghu"></i> My Account</div>
      <div class="drawer-item" @click="goToMobile('/balance')"><i class="iconfont icon-qianbao"></i> Balance</div>
      <div class="drawer-divider"></div>
      <div class="drawer-item" v-if="!store.isSeller" @click="goToMobile('/applystore')"><i class="iconfont icon-shenqing"></i> Apply Store</div>
      <div class="drawer-item" @click="goToMobile('/chattouserlist')"><i class="iconfont icon-kefu"></i> Seller Messages</div>
      <div class="drawer-item" @click="goToMobile('/internalmsg')"><i class="iconfont icon-xinxi"></i> Site Messages</div>
      <div class="drawer-item" @click="goToMobile('/sourcegoods')"><i class="iconfont icon-ziyuanxhdpi"></i> Wholesale</div>
      <div class="drawer-divider" v-if="store.isLogin"></div>
      <div class="drawer-item drawer-logout" v-if="store.isLogin" @click="handleLogoutMobile"><i class="iconfont icon-tuichu"></i> Logout</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get, qe } from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()
const keyword = ref('')
const mobileMenuOpen = ref(false)

const langNames = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English', 'de': 'Deutsch', 'fr': 'Français', 'ja': '日本語', 'es': 'español', 'vi': 'Tiếng Việt' }
const currentLangName = computed(() => langNames[store.lang] || 'English')

const searchPlaceholder = ref('Search products...')

const searchGoods = () => {
  if (keyword.value.trim()) {
    router.push(`/searchgoods?keyword=${encodeURIComponent(keyword.value.trim())}`)
  }
}

const searchStore = () => {
  if (keyword.value.trim()) {
    router.push(`/searchstore?keyword=${encodeURIComponent(keyword.value.trim())}`)
  }
}

const goTo = (path) => {
  if (store.isLogin) {
    router.push(path)
  } else {
    router.push('/login')
  }
}
const goToMobile = (path) => {
  mobileMenuOpen.value = false
  if (store.isLogin) {
    router.push(path)
  } else {
    router.push('/login')
  }
}
const searchGoodsMobile = () => {
  if (keyword.value.trim()) {
    mobileMenuOpen.value = false
    router.push(`/searchgoods?keyword=${encodeURIComponent(keyword.value.trim())}`)
  }
}
const handleLogout = () => {
  store.logout()
  router.push('/login')
  ElMessage.success('Logged out')
}
const handleLogoutMobile = () => {
  mobileMenuOpen.value = false
  store.logout()
  router.push('/login')
  ElMessage.success('Logged out')
}
</script>

<style scoped>
.s_layout_header { width: 100%; z-index: 1000; }
.s-header-top-box { background-color: var(--g-header-bg); }
.s-header-top-box .s-header-top { max-width: var(--g-main-width); margin: 0 auto; height: 40px; }
.s-header-top-box .s-header-top .s-header-top-item-list { height: 100%; gap: 15px; }
.s-header-top-item { padding-right: 15px; color: #b4b4b4; font-size: 12px; cursor: pointer; height: 100%; white-space: nowrap; }
.s-header-top-item:hover { color: #fff; }
.s-header-top-item-userinfo { gap: 4px; }
.s-header-top-item-userinfo .iconfont { font-size: 16px; }
.s-header-top-item-userinfo-username { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-header-top-item-title { margin-left: 4px; }
.s-header-top-item-val { color: var(--g-main_color); margin-left: 2px; }
.s-header-top-item-language-content { cursor: pointer; gap: 4px; }
.s-header-top-item-language-content .icon-xiala { font-size: 10px; }
.s-header-bottom-box { background: var(--g-white); border-bottom: 1px solid var(--g-border); }
.s-header-bottom { max-width: var(--g-main-width); margin: 0 auto; padding: 35px 0; }
.s-header-bottom-left { cursor: pointer; margin-right: 30px; font-size: 32px; font-weight: 700; color: var(--g-main_color); }
.s-header-bottom-center-box { flex: 1; }
.s-header-bottom-center { display: flex; align-items: center; }
.s-header-bottom-input { width: 540px; height: 36px; border: 2px solid var(--g-main_color); background: var(--g-white); }
.s-header-bottom-input input { width: 100%; height: 100%; padding: 0 12px; font-size: 14px; border: none; outline: none; }
.s-header-bottom-search-icon { height: 36px; background: var(--g-main_color); display: flex; align-items: center; justify-content: center; cursor: pointer; gap: 4px; padding: 0 14px; }
.s-header-bottom-search-icon .iconfont { color: #fff; font-size: 16px; }
.s-header-bottom-search-icon span { color: #fff; font-size: 13px; white-space: nowrap; }
.s-header-bottom-search-icon-two { background: #c91f16; border-left: 1px solid rgba(255,255,255,0.2); }
.s-headr-bottom-right { margin-left: 20px; border: 1px solid #eee; padding: 0 20px; height: 36px; line-height: 36px; cursor: pointer; color: var(--g-main_color); transition: all .5s; gap: 6px; }
.s-headr-bottom-right .iconfont { font-size: 22px; }
.s-headr-bottom-right-text { font-size: 14px; font-weight: 600; padding-left: 5px; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--g-border); font-weight: 600; }
.drawer-search { padding: 12px 16px; border-bottom: 1px solid var(--g-border); }
.drawer-search input { width: 100%; height: 36px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--g-border); background: var(--g-bg); color: var(--g-text); font-size: 14px; }
.drawer-items { padding: 4px 0; }
.drawer-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; font-size: 14px; color: var(--g-text); }
.drawer-item:hover { background: var(--g-bg); color: var(--g-main_color); }
.drawer-item .iconfont { font-size: 16px; width: 20px; text-align: center; }
.wallet-balance { cursor: pointer; color: #f0c040; font-size: 12px; padding: 2px 8px; border: 1px solid #f0c040; border-radius: 3px; transition: all 0.2s; display: flex; align-items: center; gap: 3px; }
.wallet-balance:hover { background: #f0c040; color: #222; }
.logout-btn { cursor: pointer; color: #e74c3c; font-size: 12px; padding: 2px 8px; border: 1px solid #e74c3c; border-radius: 3px; transition: all 0.2s; }
.logout-btn:hover { background: #e74c3c; color: #fff; }
.drawer-divider { height: 1px; background: var(--g-border); margin: 4px 16px; }
@media (max-width: 1024px) {
  .s-header-bottom-input { width: 100%; }
  .s-header-bottom { padding: 12px 16px; gap: 8px; }
  .s-header-bottom-left img { height: 32px; }
  .s-header-bottom-center-box { min-width: 0; }
}
@media (max-width: 480px) {
  .s-header-bottom-input { width: 100%; }
  .s-header-bottom-search-icon-one span { display: none; }
  .s-headr-bottom-right { padding: 0 10px; }
  .s-headr-bottom-right-text { display: none; }
}
</style>
