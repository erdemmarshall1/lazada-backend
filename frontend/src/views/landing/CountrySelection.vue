<template>
  <div class="country-page">
    <header class="country-header">
      <div class="country-header-inner">
        <img src="/img/outnet-logo.png" :alt="$t('country.logoAlt')" class="country-logo" />
      </div>
    </header>

    <div class="country-content">
      <h1 class="country-headline">{{ $t('country.headline') }}</h1>

      <div class="country-grid">
        <a
          v-for="country in countries"
          :key="country.code"
          class="country-item"
          @click="selectCountry(country)"
        >
          <div class="country-flag" :class="`flag-${country.code.toLowerCase()}`"></div>
          <span class="country-name">{{ country.name }}</span>
        </a>
      </div>
    </div>

    <div class="country-services">
      <div class="services-inner">
        <div class="service-card" v-for="svc in services" :key="svc.title">
          <img :src="svc.icon" :alt="svc.title" class="service-img" />
          <div class="service-title" :style="{ color: svc.color }">{{ $t(svc.titleKey) }}</div>
          <div class="service-tips">{{ $t(svc.descKey) }}</div>
        </div>
      </div>
    </div>

    <footer class="country-footer">
      <a href="javascript:void(0)" class="footer-link">{{ $t('country.backToHomepage') }}</a>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'

const router = useRouter()

const countries = [
  { code: 'AT', name: 'Austria', lang: 'de' },
  { code: 'FR', name: 'France', lang: 'fr' },
  { code: 'DE', name: 'Germany', lang: 'de' },
  { code: 'IT', name: 'Italy', lang: 'it' },
  { code: 'ES', name: 'Spain', lang: 'es' },
  { code: 'CH', name: 'Switzerland', lang: 'de' },
  { code: 'GB', name: 'United Kingdom', lang: 'en' },
  { code: 'JP', name: 'Japan', lang: 'ja' },
  { code: 'CN', name: 'China', lang: 'zh-CN' },
  { code: 'US', name: 'United States', lang: 'en' },
  { code: 'CA', name: 'Canada', lang: 'en' },
  { code: 'MX', name: 'Mexico', lang: 'es' },
  { code: 'BR', name: 'Brazil', lang: 'pt' },
  { code: 'CO', name: 'Colombia', lang: 'es' },
  { code: 'CL', name: 'Chile', lang: 'es' },
  { code: 'PE', name: 'Peru', lang: 'es' },
  { code: 'VE', name: 'Venezuela', lang: 'es' },
  { code: 'HN', name: 'Honduras', lang: 'es' },
  { code: 'MA', name: 'Morocco', lang: 'fr' },
]

const services = [
  { titleKey: 'country.logisticsTitle', icon: 'https://placehold.co/60x60/eee/333?text=📦', color: '#f84a2f', descKey: 'country.logisticsDesc' },
  { titleKey: 'country.paymentTitle', icon: 'https://placehold.co/60x60/eee/333?text=💳', color: '#f84a2f', descKey: 'country.paymentDesc' },
  { titleKey: 'country.platformTitle', icon: 'https://placehold.co/60x60/eee/333?text=🏪', color: '#f84a2f', descKey: 'country.platformDesc' },
  { titleKey: 'country.customerServiceTitle', icon: 'https://placehold.co/60x60/eee/333?text=💬', color: '#f84a2f', descKey: 'country.customerServiceDesc' },
  { titleKey: 'country.recommendationsTitle', icon: 'https://placehold.co/60x60/eee/333?text=⭐', color: '#f84a2f', descKey: 'country.recommendationsDesc' },
  { titleKey: 'country.apiTitle', icon: 'https://placehold.co/60x60/eee/333?text=🔗', color: '#f84a2f', descKey: 'country.apiDesc' },
]

const { changeLanguage } = useLanguage()

const selectCountry = async (country) => {
  if (country.lang) {
    await changeLanguage(country.lang)
  }
}
</script>

<style scoped>
.country-page { min-height: 100vh; display: flex; flex-direction: column; font-family: 'TheOutnetWebXL', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; }

.country-header { height: 72px; border-bottom: 1px solid #d0d1d3; display: flex; align-items: center; justify-content: center; background: #fff; }
.country-header-inner { max-width: 1200px; width: 100%; padding: 0 20px; }
.country-logo { height: 40px; width: auto; }

.country-content { flex: 1; padding: 30px 20px; max-width: 1200px; margin: 0 auto; width: 100%; }
.country-headline { font-size: 40px; font-weight: 700; color: #1a1a1a; margin-bottom: 30px; line-height: 1.2; }

.country-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 60px; }
.country-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 190px; height: 100px; border: 1px solid #e9e9e9; border-radius: 8px;
  cursor: pointer; transition: all 0.3s; background: #fff; text-decoration: none;
}
.country-item:hover { border-color: #ee4d2d; box-shadow: 0 4px 12px rgba(238,77,45,0.1); transform: translateY(-2px); }

.country-flag {
  width: 45px; height: 45px; border-radius: 4px; margin-bottom: 8px;
  background: #e9e9e9; display: flex; align-items: center; justify-content: center;
  font-size: 28px; line-height: 1;
}
.country-name { font-size: 13px; color: #192537; font-weight: 500; }

.country-services { background: #fff; border-top: 1px solid #e9e9e9; padding: 40px 20px; }
.services-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; }

.service-card { text-align: center; }
.service-img { width: 60px; height: 60px; margin-bottom: 16px; }
.service-title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.service-tips { font-size: 14px; color: #192537; opacity: 0.7; line-height: 1.5; }

.country-footer { background: #6328e0; padding: 20px; text-align: center; }
.footer-link { color: #fff; font-size: 14px; text-decoration: none; font-family: Helvetica, sans-serif; }
.footer-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .country-headline { font-size: 28px; }
  .country-grid { gap: 12px; }
  .country-item { width: 140px; height: 80px; }
  .services-inner { grid-template-columns: 1fr; gap: 24px; }
}
@media (max-width: 480px) {
  .country-headline { font-size: 22px; }
  .country-item { width: 120px; height: 70px; }
}
</style>
