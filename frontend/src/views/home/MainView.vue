<template>
  <div class="ton-home">
    <div class="ton-promo-bar">
      <span>FREE SHIPPING on orders over $500 · Use code: WHOLESALE</span>
      <a class="ton-promo-link" href="/main">Exclusions apply – see T&amp;Cs</a>
    </div>

    <section class="ton-hero">
      <div class="ton-hero-slider" ref="heroSlider">
        <div class="ton-hero-track" :style="{ transform: 'translateX(-' + heroIndex * 100 + '%)' }">
          <div class="ton-hero-slide" v-for="(banner, idx) in banners.length ? banners : fallbackBanners" :key="idx">
            <a :href="banner.link || '#'" class="ton-hero-link">
              <div class="ton-hero-img-wrap">
                <div class="ton-hero-fallback" v-if="!banner.image" :style="{ background: heroColors[idx % heroColors.length] }">
                  <div class="ton-hero-content">
                    <span class="ton-hero-tag">{{ banner.tag || 'NEW SEASON' }}</span>
                    <h2 class="ton-hero-title">{{ banner.title || heroTitles[idx] }}</h2>
                    <p class="ton-hero-subtitle">{{ banner.subtitle || heroSubtitles[idx] }}</p>
                    <span class="ton-hero-cta">SHOP NOW</span>
                  </div>
                </div>
                <img v-else :src="$imgUrl(banner.image)" :alt="banner.title" @error="$imgFallback" />
              </div>
            </a>
          </div>
        </div>
        <button class="ton-hero-arrow ton-hero-arrow--left" @click="heroPrev" v-if="banners.length > 1">
          <svg width="10" height="20" viewBox="0 0 10 20"><path d="M9.28 19.266l.53-.531L1.075 10 9.81 1.265l-.53-.53L.015 10z" fill="#000"/></svg>
        </button>
        <button class="ton-hero-arrow ton-hero-arrow--right" @click="heroNext" v-if="banners.length > 1">
          <svg width="10" height="20" viewBox="0 0 10 20"><path d="M.72.734l-.53.531L8.925 10 .19 18.735l.53.53L9.985 10z" fill="#000"/></svg>
        </button>
      </div>
    </section>

    <section class="ton-section">
      <div class="ton-section-head">
        <h2 class="ton-section-title">JUST IN</h2>
        <span class="ton-section-link" @click="$router.push('/searchgoods')">View All</span>
      </div>
      <div class="ton-just-in-grid" v-if="newArrivals.length > 0">
        <div class="ton-just-in-hero-card">
          <h3 class="ton-just-in-count">$number</h3>
          <p class="ton-just-in-desc">A curated selection of the latest styles added this week</p>
          <button class="ton-btn ton-btn--outline" @click="$router.push('/searchgoods')">SHOP AT UP TO 60% OFF</button>
        </div>
        <div class="ton-just-in-card" v-for="item in newArrivals.slice(0, 5)" :key="item._id" @click="goDetail(item._id)">
          <div class="ton-just-in-img">
            <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
          </div>
          <h4 class="ton-just-in-name">{{ item.name }}</h4>
          <div class="ton-just-in-price">
            <span class="ton-price">${{ item.minPrice }}</span>
            <span class="ton-price-old" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ton-section ton-section--alt">
      <div class="ton-section-head">
        <h2 class="ton-section-title">BESTSELLERS</h2>
        <span class="ton-section-link" @click="$router.push('/remenglist')">View All</span>
      </div>
      <div class="ton-carousel">
        <div class="ton-carousel-track" ref="bestsellerTrack">
          <div class="ton-prod-card" v-for="item in bestSellers.slice(0, 10)" :key="item._id" @click="goDetail(item._id)">
            <div class="ton-prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
            </div>
            <h4 class="ton-prod-name">{{ item.name }}</h4>
            <div class="ton-prod-price">
              <span class="ton-price">${{ item.minPrice }}</span>
              <span class="ton-price-old" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
            </div>
          </div>
        </div>
        <button class="ton-carousel-arrow left" @click="scrollCarousel(-1, bestsellerTrack)"><svg width="10" height="20" viewBox="0 0 10 20"><path d="M9.28 19.266l.53-.531L1.075 10 9.81 1.265l-.53-.53L.015 10z" fill="#000"/></svg></button>
        <button class="ton-carousel-arrow right" @click="scrollCarousel(1, bestsellerTrack)"><svg width="10" height="20" viewBox="0 0 10 20"><path d="M.72.734l-.53.531L8.925 10 .19 18.735l.53.53L9.985 10z" fill="#000"/></svg></button>
      </div>
    </section>

    <section class="ton-section">
      <div class="ton-promo-grid">
        <div class="ton-promo-card" v-for="(promo, idx) in promoBlocks" :key="idx" @click="$router.push(promo.link)">
          <div class="ton-promo-img">
            <div class="ton-promo-fallback" :style="{ background: promo.color }">
              <div class="ton-promo-text">
                <h3>{{ promo.title }}</h3>
                <p>{{ promo.subtitle }}</p>
                <span class="ton-btn ton-btn--small">SHOP NOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ton-section ton-section--alt">
      <div class="ton-section-head">
        <h2 class="ton-section-title">HOT PRODUCTS</h2>
        <span class="ton-section-link" @click="$router.push('/remenglist')">View All</span>
      </div>
      <div class="ton-carousel">
        <div class="ton-carousel-track" ref="hotTrack">
          <div class="ton-prod-card" v-for="item in hotProducts.slice(0, 10)" :key="item._id" @click="goDetail(item._id)">
            <div class="ton-prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
              <span class="ton-badge ton-badge--discount" v-if="item.originalPrice > item.minPrice">-{{ calcDiscount(item.minPrice, item.originalPrice) }}%</span>
            </div>
            <h4 class="ton-prod-name">{{ item.name }}</h4>
            <div class="ton-prod-price">
              <span class="ton-price">${{ item.minPrice }}</span>
              <span class="ton-price-old" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
            </div>
          </div>
        </div>
        <button class="ton-carousel-arrow left" @click="scrollCarousel(-1, hotTrack)"><svg width="10" height="20" viewBox="0 0 10 20"><path d="M9.28 19.266l.53-.531L1.075 10 9.81 1.265l-.53-.53L.015 10z" fill="#000"/></svg></button>
        <button class="ton-carousel-arrow right" @click="scrollCarousel(1, hotTrack)"><svg width="10" height="20" viewBox="0 0 10 20"><path d="M.72.734l-.53.531L8.925 10 .19 18.735l.53.53L9.985 10z" fill="#000"/></svg></button>
      </div>
    </section>

    <section class="ton-section">
      <div class="ton-section-head">
        <h2 class="ton-section-title">RECOMMENDED FOR YOU</h2>
        <span class="ton-section-link" @click="$router.push('/tuijianlist')">View All</span>
      </div>
      <div class="ton-grid-4">
        <div class="ton-prod-card" v-for="item in recommendedProducts.slice(0, 8)" :key="item._id" @click="goDetail(item._id)">
          <div class="ton-prod-img">
            <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
            <span class="ton-badge ton-badge--discount" v-if="item.originalPrice > item.minPrice">-{{ calcDiscount(item.minPrice, item.originalPrice) }}%</span>
          </div>
          <h4 class="ton-prod-name">{{ item.name }}</h4>
          <div class="ton-prod-price">
            <span class="ton-price">${{ item.minPrice }}</span>
            <span class="ton-price-old" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ton-section ton-section--alt">
      <div class="ton-section-head">
        <h2 class="ton-section-title">SHOP BY CATEGORY</h2>
      </div>
      <div class="ton-cat-grid">
        <div class="ton-cat-item" v-for="cat in categories.slice(0, 16)" :key="cat._id" @click="goCategory(cat._id)">
          <div class="ton-cat-icon">{{ getCatEmoji(cat.name) }}</div>
          <span class="ton-cat-label">{{ cat.name }}</span>
        </div>
      </div>
    </section>

    <QuickViewDialog :visible="quickViewVisible" :product-id="quickViewProductId" @close="quickViewVisible = false" @added-to-cart="quickViewVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { get, qe } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const router = useRouter()
const store = useAppStore()

const categories = ref([])
const hotProducts = ref([])
const recommendedProducts = ref([])
const newArrivals = ref([])
const bestSellers = ref([])
const banners = ref([])
const heroIndex = ref(0)
const heroSlider = ref(null)
const bestsellerTrack = ref(null)
const hotTrack = ref(null)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')
const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

let heroTimer = null

const heroColors = ['#f4f2ee', '#e8e6e2', '#faf8f4', '#f0ece4']
const heroTitles = ['Premium Collection', 'Bulk Pricing', 'Distributor Deals', 'New Season']
const heroSubtitles = ['Discover luxury fashion at wholesale prices', 'Volume discounts up to 40% off retail', 'Exclusive pricing for registered wholesalers', 'Fresh inventory']

const fallbackBanners = [
  { tag: 'WHOLESALE', title: 'Premium Collection', subtitle: 'Discover luxury fashion at wholesale prices', link: '/searchgoods' },
  { tag: 'BULK', title: 'Bulk Pricing', subtitle: 'Volume discounts up to 40% off retail', link: '/searchgoods' },
]

const promoBlocks = [
  { title: 'Summer Edit', subtitle: "Shop the season's essentials", link: '/searchgoods', color: '#f4f2ee' },
  { title: 'Accessories', subtitle: 'Complete the look', link: '/searchgoods', color: '#e8e6e2' },
  { title: 'Luxury Bags', subtitle: 'Designer styles reduced', link: '/searchgoods', color: '#ddd' },
  { title: 'Shoes', subtitle: 'Step up your style', link: '/searchgoods', color: '#f4f2ee' },
]

const catEmojis = {
  'Fashion': '👗', 'Shoes': '👟', 'Men Clothing': '👔', 'Women Clothing': '👗',
  'Bags': '👜', 'Accessories': '⌚', 'Electronics': '📱', 'Smartphones': '📱',
  'Laptops': '💻', 'Headphones': '🎧', 'Television': '📺', 'Furniture': '🛋️',
  'Skincare': '🧴', 'Makeup': '💄', 'Fitness': '🏋️', 'Home & Living': '🏠',
  'Beauty': '💅', 'Sports': '⚽',
}
const getCatEmoji = (name) => catEmojis[name] || '📦'
const calcDiscount = (min, max) => max > 0 ? Math.round((1 - min / max) * 100) : 0
const goCategory = (id) => router.push('/secondsort?categoryId=' + id)
const goDetail = (id) => router.push('/gooddetail?id=' + id)

const heroNext = () => { heroIndex.value = (heroIndex.value + 1) % (banners.value.length || fallbackBanners.length) }
const heroPrev = () => { heroIndex.value = (heroIndex.value - 1 + (banners.value.length || fallbackBanners.length)) % (banners.value.length || fallbackBanners.length) }

const scrollCarousel = (dir, el) => {
  if (!el.value) return
  const first = el.value.querySelector('.ton-prod-card')
  const scrollAmount = (first ? first.offsetWidth : 200) + 12
  el.value.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' })
}

onMounted(async () => {
  const [catRes, hotRes, recRes, banRes, newRes, bestRes] = await Promise.all([
    get('/main/goodsCategory/getList'),
    get('/main/goods/getHotList'),
    get('/main/goods/getSearchList', { isRecommended: true, pageSize: 20 }),
    get('/main/banner/getList'),
    get('/main/goods/getSearchList', { sort: 'new', order: 'desc', pageSize: 10 }),
    get('/main/goods/getSearchList', { sort: 'sales', order: 'desc', pageSize: 10 }),
  ])
  if (catRes?.data) categories.value = catRes.data
  if (hotRes?.data) hotProducts.value = Array.isArray(hotRes.data) ? hotRes.data : hotRes.data.list || []
  if (recRes?.data) recommendedProducts.value = recRes.data.list || []
  if (banRes?.data) banners.value = Array.isArray(banRes.data) ? banRes.data : banRes.data.list || []
  if (newRes?.data) newArrivals.value = newRes.data.list || []
  if (bestRes?.data) bestSellers.value = bestRes.data.list || []

  heroTimer = setInterval(function () { heroNext() }, 5000)
})

onBeforeUnmount(function () {
  if (heroTimer) clearInterval(heroTimer)
})
</script>

<style scoped>
.ton-home { background: #ffffff; min-height: 100vh; padding-bottom: 40px; }

.ton-promo-bar { background: var(--g-main_color); color: #ffffff; text-align: center; padding: 10px 16px; font-size: 12px; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.ton-promo-link { color: #b8922a; text-decoration: underline; font-size: 11px; }

.ton-hero { max-width: 1440px; margin: 0 auto; overflow: hidden; }
.ton-hero-slider { position: relative; overflow: hidden; height: 480px; }
.ton-hero-track { display: flex; height: 100%; transition: transform 0.6s ease; }
.ton-hero-slide { min-width: 100%; height: 100%; }
.ton-hero-link { display: block; width: 100%; height: 100%; }
.ton-hero-img-wrap { width: 100%; height: 100%; }
.ton-hero-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.ton-hero-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.ton-hero-content { text-align: center; color: #000; max-width: 600px; padding: 0 20px; }
.ton-hero-tag { display: inline-block; font-size: 11px; font-weight: 400; letter-spacing: 3px; margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.15); padding-bottom: 8px; }
.ton-hero-title { font-size: 42px; font-weight: 300; font-family: var(--g-font-family); margin-bottom: 16px; line-height: 1.15; }
.ton-hero-subtitle { font-size: 14px; color: rgba(0,0,0,0.5); margin-bottom: 28px; }
.ton-hero-cta { display: inline-block; border: 1px solid #000; color: #000; padding: 12px 36px; font-size: 12px; letter-spacing: 2px; transition: all 0.2s; cursor: pointer; }
.ton-hero-cta:hover { background: #000; color: #fff; }
.ton-hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; transition: opacity 0.2s; }
.ton-hero-arrow:hover { opacity: 0.8; }
.ton-hero-arrow--left { left: 16px; }
.ton-hero-arrow--right { right: 16px; }

.ton-section { max-width: 1200px; margin: 32px auto; padding: 0 20px; }
.ton-section--alt { background: #faf8f4; padding: 32px 20px; max-width: 100%; }
.ton-section--alt > .ton-section-head, .ton-section--alt > .ton-carousel, .ton-section--alt > .ton-grid-4, .ton-section--alt > .ton-cat-grid { max-width: 1200px; margin-left: auto; margin-right: auto; }
.ton-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.ton-section-title { font-size: 24px; font-weight: 300; letter-spacing: 2px; font-family: var(--g-font-family); }
.ton-section-link { font-size: 12px; color: #888; cursor: pointer; letter-spacing: 0.5px; }
.ton-section-link:hover { color: #000; }

.ton-just-in-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; }
.ton-just-in-hero-card { background: #f4f2ee; padding: 24px; display: flex; flex-direction: column; justify-content: center; grid-column: 1 / 2; grid-row: 1 / 3; }
.ton-just-in-count { font-size: 48px; font-weight: 300; margin-bottom: 8px; }
.ton-just-in-desc { font-size: 13px; color: #555; margin-bottom: 20px; line-height: 1.6; }
.ton-just-in-card { cursor: pointer; transition: transform 0.2s; }
.ton-just-in-card:hover { transform: translateY(-2px); }
.ton-just-in-img { aspect-ratio: 1; background: #f4f2ee; overflow: hidden; margin-bottom: 8px; }
.ton-just-in-img img { width: 100%; height: 100%; object-fit: cover; }
.ton-just-in-name { font-size: 13px; font-weight: 400; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ton-just-in-price { display: flex; align-items: center; gap: 6px; }

.ton-btn { display: inline-block; border: 1px solid #000; color: #000; padding: 10px 24px; font-size: 11px; letter-spacing: 1.5px; cursor: pointer; transition: all 0.2s; background: transparent; }
.ton-btn:hover { background: #000; color: #fff; }
.ton-btn--small { padding: 8px 20px; font-size: 10px; }
.ton-btn--outline { border: 1px solid #000; color: #000; padding: 12px 28px; font-size: 11px; letter-spacing: 1.5px; background: transparent; cursor: pointer; }
.ton-btn--outline:hover { background: #000; color: #fff; }

.ton-carousel { position: relative; }
.ton-carousel-track { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 8px; }
.ton-carousel-track::-webkit-scrollbar { height: 4px; }
.ton-carousel-track::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
.ton-carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.ton-carousel-arrow.left { left: -12px; }
.ton-carousel-arrow.right { right: -12px; }

.ton-prod-card { flex: 0 0 200px; scroll-snap-align: start; cursor: pointer; transition: transform 0.2s; }
.ton-prod-card:hover { transform: translateY(-2px); }
.ton-prod-img { aspect-ratio: 1; background: #f4f2ee; overflow: hidden; position: relative; margin-bottom: 8px; }
.ton-prod-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.ton-prod-card:hover .ton-prod-img img { transform: scale(1.03); }
.ton-prod-name { font-size: 13px; font-weight: 400; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ton-prod-price { display: flex; align-items: center; gap: 6px; }
.ton-price { font-size: 16px; font-weight: 500; }
.ton-price-old { font-size: 12px; color: #888; text-decoration: line-through; }
.ton-badge { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 600; padding: 3px 8px; z-index: 2; }
.ton-badge--discount { background: #000; color: #fff; }
.ton-badge--new { background: #b8922a; color: #fff; }

.ton-promo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ton-promo-card { cursor: pointer; }
.ton-promo-img { aspect-ratio: 1; overflow: hidden; }
.ton-promo-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.ton-promo-text { text-align: center; padding: 20px; }
.ton-promo-text h3 { font-size: 18px; font-weight: 300; margin-bottom: 6px; }
.ton-promo-text p { font-size: 12px; color: #555; margin-bottom: 16px; }

.ton-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ton-grid-4 .ton-prod-card { flex: unset; }

.ton-cat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; }
.ton-cat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; padding: 12px 4px; border-radius: 8px; transition: background 0.2s; font-size: 12px; }
.ton-cat-item:hover { background: #e8e6e2; }
.ton-cat-icon { font-size: 28px; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: #f4f2ee; border-radius: 50%; }
.ton-cat-label { text-align: center; line-height: 1.2; }

@media (max-width: 1024px) {
  .ton-just-in-grid { grid-template-columns: 1fr 1fr; }
  .ton-just-in-hero-card { grid-column: 1 / -1; grid-row: auto; }
  .ton-promo-grid { grid-template-columns: repeat(2, 1fr); }
  .ton-grid-4 { grid-template-columns: repeat(3, 1fr); }
  .ton-cat-grid { grid-template-columns: repeat(4, 1fr); }
  .ton-hero-title { font-size: 32px; }
}

@media (max-width: 768px) {
  .ton-hero-slider { height: 320px; }
  .ton-hero-title { font-size: 26px; }
  .ton-hero-arrow { display: none; }
  .ton-just-in-grid { grid-template-columns: 1fr 1fr; }
  .ton-just-in-hero-card { padding: 16px; }
  .ton-just-in-count { font-size: 36px; }
  .ton-prod-card { flex: 0 0 160px; }
  .ton-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .ton-cat-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 480px) {
  .ton-prod-card { flex: 0 0 140px; }
  .ton-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .ton-promo-grid { grid-template-columns: 1fr 1fr; }
  .ton-cat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ton-cat-icon { width: 44px; height: 44px; font-size: 22px; }
}
</style>
