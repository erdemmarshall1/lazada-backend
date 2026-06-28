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
import { onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { get, qe } from '@/api/request'
import MainLayoutHeader from './MainLayoutHeader.vue'
import MainLayoutFooter from './MainLayoutFooter.vue'
import MainLayoutNav from './MainLayoutNav.vue'
import PwaInstallBanner from '@/components/PwaInstallBanner.vue'

const store = useAppStore()
let walletTimer = null

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

onMounted(async () => {
  const res = await qe(get('/main/index/init'))
  if (res && res.data) {
    store.lunbo = res.data.banners || []
    store.langList = res.data.langList || []
    store.system = res.data.system || {}
    store.webLogo = res.data.webLogo || {}
    store.kefu = res.data.kefu || ''
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
  if (walletTimer) {
    clearInterval(walletTimer)
    walletTimer = null
  }
})
</script>

<style scoped>
.v_app { min-height: 100vh; display: flex; flex-direction: column; }
.v_main_layout { flex: 1; display: flex; flex-direction: column; }
.kefu { position: fixed; right: 20px; bottom: 100px; width: 50px; height: 50px; border-radius: 50%; background: var(--g-main_color); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.kefu .iconfont { font-size: 24px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
