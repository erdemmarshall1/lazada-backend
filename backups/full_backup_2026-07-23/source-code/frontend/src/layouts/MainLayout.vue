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
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

