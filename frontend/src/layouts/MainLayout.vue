<template>
  <div class="v_app">
    <div class="v_main_layout">
      <PwaInstallBanner mode="popup" />
      <MainLayoutHeader />
      <MainLayoutNav />
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <MainLayoutFooter />
      <div class="kefu" v-if="store.kefu" @click="openKefu">
        <i class="iconfont icon-kefu"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, qe } from '@/api/request'
import MainLayoutHeader from './MainLayoutHeader.vue'
import MainLayoutNav from './MainLayoutNav.vue'
import MainLayoutFooter from './MainLayoutFooter.vue'
import PwaInstallBanner from '@/components/PwaInstallBanner.vue'

const store = useAppStore()
let walletTimer = null

const clearWalletTimer = () => {
  if (walletTimer) {
    clearInterval(walletTimer)
    walletTimer = null
  }
}

watch(() => store.token, (newToken) => {
  if (!newToken) {
    clearWalletTimer()
  }
})

const openTawkto = () => {
  if (window.Tawk_API && store.tawkTo.enabled) {
    window.Tawk_API.maximize()
  }
}

const openKefu = () => {
  window.open(store.kefu, '_blank')
}

const loadWallet = async () => {
  if (!store.token) return
  const res = await qe(get('/home/userWallet/getList'))
  if (res?.data?.length > 0 && res.data[0].balance !== undefined) {
    store.setWalletBalance(res.data[0].balance)
  }
}

const applyTheme = (theme) => {
  store.applyTheme(theme)
}

onMounted(async () => {
  const res = await qe(get('/main/index/init'))
  if (res && res.data) {
    store.lunbo = res.data.banners || []
    store.langList = res.data.langList || []
    store.system = res.data.system || {}
    store.webLogo = res.data.webLogo || {}
    store.kefu = res.data.kefu || ''
  }
  if (res?.data?.themeSettings) {
    applyTheme(res.data.themeSettings)
  }
  if (store.token) {
    const userRes = await qe(get('/home/user/getInfo'))
    if (userRes && userRes.data) {
      store.setUserInfo(userRes.data)
    }
    await loadWallet()
    walletTimer = setInterval(loadWallet, 30000)
  }
})

onUnmounted(() => {
  clearWalletTimer()
})
</script>

<style scoped>
.v_app { min-height: 100vh; display: flex; flex-direction: column; }
.v_main_layout { flex: 1; display: flex; flex-direction: column; }
.kefu { position: fixed; right: 20px; bottom: 100px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(90deg, #ff3333, #0a68ff); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999; box-shadow: 0 4px 16px rgba(238,77,45,0.3); transition: transform 0.2s, box-shadow 0.2s; }
.kefu:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(238,77,45,0.4); }
.kefu .iconfont { font-size: 26px; }
.kefu-label { position: absolute; right: 62px; background: #333; color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 4px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.kefu:hover .kefu-label { opacity: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

