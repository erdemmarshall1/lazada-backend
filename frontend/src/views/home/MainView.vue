<template>
  <div class="shein-home">
    <!-- Top Promo Banner -->
    <div class="top-promo">
      <span>🔥 FREE SHIPPING on orders over $500 | Use code: WHOLESALE</span>
    </div>

    <!-- Hero Banner Carousel -->
    <section class="hero-section">
      <el-carousel :interval="4500" height="420px" arrow="always" trigger="click" indicator-position="none">
        <el-carousel-item v-for="(banner, idx) in banners" :key="idx">
          <div class="hero-slide" :style="{ background: heroGradients[idx % heroGradients.length] }" @click="goLink(banner.link)">
            <div class="hero-content">
              <span class="hero-tag">{{ banner.tag || getTag(idx) }}</span>
              <h1 class="hero-title">{{ banner.title || getHeroTitle(idx) }}</h1>
              <p class="hero-desc">{{ banner.subtitle || getHeroSub(idx) }}</p>
              <button class="hero-btn">SHOP NOW →</button>
            </div>
            <div class="hero-visual" v-if="banner.image">
              <img :src="$imgUrl(banner.image)" :alt="banner.title" @error="$imgFallback" />
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>

    <!-- Category Strip -->
    <section class="section cat-strip">
      <div class="cat-strip-inner">
        <div class="cat-item" v-for="cat in categories.slice(0, 12)" :key="cat._id" @click="goCategory(cat._id)">
          <div class="cat-circle">
            <span class="cat-emoji">{{ getCatEmoji(cat.name) }}</span>
          </div>
          <span class="cat-label">{{ cat.name }}</span>
        </div>
      </div>
    </section>

    <!-- Shop Street -->
    <section class="section stores-section" v-if="stores.length > 0">
      <div class="section-head">
        <h2>🛍️ Shop Street</h2>
        <span class="section-link" @click="$router.push('/shopjie')">View All ›</span>
      </div>
      <div class="hscroll">
        <div class="hscroll-track">
          <div class="store-card" v-for="s in stores" :key="s._id" @click="$router.push(`/storedetail?id=${s._id}`)">
            <div class="store-logo-wrap">
              <img :src="$imgUrl(s.logo)" :alt="s.name" class="store-logo" @error="$imgFallback" />
            </div>
            <h4 class="store-name">{{ s.name }}</h4>
            <div class="store-rating">⭐ {{ (s.rating || 0).toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Banner Row -->
    <section class="section banner-row" v-if="banners[1]">
      <div class="banner-card" :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }" @click="goLink(banners[1].link)">
        <div class="banner-text">
          <h3>{{ banners[1].title || 'Premium Wholesale' }}</h3>
          <p>Bulk orders at factory prices — minimum 10 units</p>
        </div>
        <img :src="$imgUrl(banners[1].image)" alt="" @error="$imgFallback" class="banner-img" />
      </div>
    </section>

    <!-- Flash Deals -->
    <section class="section flash-section" v-if="flashDeals.length > 0">
      <div class="section-head">
        <h2><span class="flash-icon">⚡</span> Flash Deals</h2>
        <div class="flash-timer" v-if="flashTime > 0">
          <span class="timer-label">Ends in</span>
          <span class="timer-block">{{ formatTime(flashTime) }}</span>
        </div>
        <span class="section-link" @click="$router.push('/miaoshalist')">View All ›</span>
      </div>
      <div class="hscroll">
        <div class="hscroll-track">
          <div class="prod-card flash-card" v-for="item in flashDeals" :key="item._id" @click="goDetail(item._id)">
            <div class="prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
              <span class="discount-badge">-{{ calcDiscount(item.minPrice, item.originalPrice) }}%</span>
              <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
            </div>
            <div class="prod-info">
              <h4 class="prod-name">{{ item.name }}</h4>
              <div class="prod-price">
                <span class="curr-price">${{ item.flashSalePrice || item.minPrice }}</span>
                <span class="old-price">${{ item.originalPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Hot Products -->
    <section class="section">
      <div class="section-head">
        <h2>🔥 Hot Products</h2>
        <span class="section-link" @click="$router.push('/remenglist')">View All ›</span>
      </div>
      <div class="hscroll">
        <div class="hscroll-track">
          <div class="prod-card" v-for="item in hotProducts" :key="item._id" @click="goDetail(item._id)">
            <div class="prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
              <span class="discount-badge" v-if="item.originalPrice > item.minPrice">-{{ calcDiscount(item.minPrice, item.originalPrice) }}%</span>
              <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
            </div>
            <div class="prod-info">
              <h4 class="prod-name">{{ item.name }}</h4>
              <div class="prod-price">
                <span class="curr-price">${{ item.minPrice }}</span>
                <span class="old-price" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
              </div>
              <div class="prod-meta">
                <span>⭐ {{ item.rating }}</span>
                <span>{{ item.salesCount || 0 }} sold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mid Banner Row -->
    <section class="section banner-row" v-if="banners[2]">
      <div class="banner-card banner-card-sm" :style="{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }" @click="goLink(banners[2].link)">
        <div class="banner-text">
          <h3>{{ banners[2].title || 'New Arrivals' }}</h3>
          <p>Shop the latest wholesale collections</p>
        </div>
        <img :src="$imgUrl(banners[2].image)" alt="" @error="$imgFallback" class="banner-img" />
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="section" v-if="newArrivals.length > 0">
      <div class="section-head">
        <h2>🆕 New Arrivals</h2>
        <span class="section-link" @click="$router.push('/searchgoods')">View All ›</span>
      </div>
      <div class="hscroll">
        <div class="hscroll-track">
          <div class="prod-card" v-for="item in newArrivals" :key="item._id" @click="goDetail(item._id)">
            <div class="prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
              <span class="new-badge">NEW</span>
              <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
            </div>
            <div class="prod-info">
              <h4 class="prod-name">{{ item.name }}</h4>
              <div class="prod-price">
                <span class="curr-price">${{ item.minPrice }}</span>
                <span class="old-price" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
              </div>
              <div class="prod-meta">
                <span>⭐ {{ item.rating }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Product Rows -->
    <section class="section" v-for="cp in categoryProducts.slice(0, 3)" :key="cp.categoryId">
      <div class="section-head">
        <h2>{{ cp.categoryName }}</h2>
        <span class="section-link" @click="goCategory(cp.categoryId)">View All ›</span>
      </div>
      <div class="hscroll">
        <div class="hscroll-track">
          <div class="prod-card" v-for="item in cp.products.slice(0, 10)" :key="item._id" @click="goDetail(item._id)">
            <div class="prod-img">
              <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
              <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
            </div>
            <div class="prod-info">
              <h4 class="prod-name">{{ item.name }}</h4>
              <div class="prod-price">
                <span class="curr-price">${{ item.minPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Banner -->
    <section class="section banner-row" v-if="banners[3]">
      <div class="banner-card banner-card-sm" :style="{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }" @click="goLink(banners[3].link)">
        <div class="banner-text">
          <h3>{{ banners[3].title || 'Best Sellers' }}</h3>
          <p>Top-rated wholesale products</p>
        </div>
        <img :src="$imgUrl(banners[3].image)" alt="" @error="$imgFallback" class="banner-img" />
      </div>
    </section>

    <!-- Recommended Grid -->
    <section class="section">
      <div class="section-head">
        <h2>⭐ Recommended For You</h2>
        <span class="section-link" @click="$router.push('/tuijianlist')">View All ›</span>
      </div>
      <div class="grid-4">
        <div class="prod-card grid-card" v-for="item in recommendedProducts.slice(0, 8)" :key="item._id" @click="goDetail(item._id)">
          <div class="prod-img">
            <img :src="$imgUrl(item.images?.[0])" :alt="item.name" loading="lazy" @error="$imgFallback" />
            <span class="discount-badge" v-if="item.originalPrice > item.minPrice">-{{ calcDiscount(item.minPrice, item.originalPrice) }}%</span>
            <div class="qv-overlay" @click.stop="openQuickView(item._id)"><span>Quick View</span></div>
          </div>
          <div class="prod-info">
            <h4 class="prod-name">{{ item.name }}</h4>
            <div class="prod-price">
              <span class="curr-price">${{ item.minPrice }}</span>
              <span class="old-price" v-if="item.originalPrice > item.minPrice">${{ item.originalPrice }}</span>
            </div>
            <div class="prod-meta">
              <span>⭐ {{ item.rating }}</span>
              <span>{{ item.salesCount || 0 }} sold</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Grid (2 rows x 8) -->
    <section class="section cat-grid-section">
      <div class="section-head">
        <h2>📂 Shop by Category</h2>
      </div>
      <div class="cat-grid">
        <div class="cat-grid-item" v-for="cat in categories.slice(0, 16)" :key="cat._id" @click="goCategory(cat._id)">
          <div class="cat-grid-icon" v-if="getCatPhoto(cat.name)">
            <img :src="$imgUrl(getCatPhoto(cat.name))" :alt="cat.name" class="cat-photo" @error="$imgFallback" />
          </div>
          <div class="cat-grid-icon" v-else>{{ getCatEmoji(cat.name) }}</div>
          <span>{{ cat.name }}</span>
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
import { get, post, qe } from '@/api/request'
import QuickViewDialog from '@/components/QuickViewDialog.vue'

const router = useRouter()
const store = useAppStore()

const categories = ref([])
const hotProducts = ref([])
const recommendedProducts = ref([])
const flashDeals = ref([])
const newArrivals = ref([])
const bestSellers = ref([])
const categoryProducts = ref([])
const banners = ref([])
const stores = ref([])
const flashTime = ref(0)
const quickViewVisible = ref(false)
const quickViewProductId = ref('')
const openQuickView = (id) => { quickViewProductId.value = id; quickViewVisible.value = true }

const heroGradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #6c3483 50%, #bb8fce 100%)',
  'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)',
  'linear-gradient(135deg, #5c1a1a 0%, #922b21 50%, #e74c3c 100%)',
  'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
]

const heroTitles = [
  'Wholesale Premium Collection',
  'Bulk Pricing Available',
  'Distributor Discounts',
  'Warehouse Sale',
  'New Season Stock',
]
const heroSubs = [
  'Minimum order: 10 units | Free shipping over $500',
  'Volume discounts up to 40% off retail',
  'Exclusive pricing for registered wholesalers',
  'Up to 60% off on bulk purchases',
  'Fresh inventory — be the first to stock',
]
const heroTags = ['WHOLESALE', 'BULK', 'DEALER', 'DISCOUNT', 'NEW']

const getTag = (i) => heroTags[i % heroTags.length]
const getHeroTitle = (i) => heroTitles[i % heroTitles.length]
const getHeroSub = (i) => heroSubs[i % heroSubs.length]

const catEmojis = {
  'Fashion': '👗', 'Shoes': '👟', 'Men Clothing': '👔', 'Women Clothing': '👗',
  'Bags': '👜', 'Accessories': '⌚', 'Electronics': '📱', 'Smartphones': '📱',
  'Laptops': '💻', 'Headphones': '🎧', 'Television': '📺', 'Bluetooth Speakers': '🔊',
  'Speakers': '🔊', 'Apple Watch': '⌚', 'Furniture': '🛋️', 'Skincare': '🧴',
  'Makeup': '💄', 'Fitness': '🏋️', 'Home & Living': '🏠', 'Beauty': '💅',
  'Sports': '⚽',
}
const getCatEmoji = (name) => catEmojis[name] || '📦'

const catPhotos = {
  'Smartphones': 'https://pixabay.com/get/g78f3da1d6adbaaac35531d6de33dadc2bae9d8e893feddf78e596a3c637d99a17b8303d72c6b9e5a6fa4ec5b58bfe13412d7ba58905e689f090cbf640717398d_640.png',
  'Fitness': 'https://pixabay.com/get/g61a68013093f973865c7c4cd96c1a982b2e3f91b41fbe062237653a660407bdf48d0b318b49022fb0a8da91c24829d08_640.jpg',
}
const getCatPhoto = (name) => catPhotos[name] || ''

const calcDiscount = (min, max) => max > 0 ? Math.round((1 - min / max) * 100) : 0

const formatTime = (t) => {
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const goLink = (link) => { if (link) router.push(link) }
const goCategory = (id) => { router.push(`/secondsort?categoryId=${id}`) }
const goDetail = (id) => { router.push(`/gooddetail?id=${id}`) }

const loadCategoryProducts = async (cats) => {
  const results = []
  for (const cat of cats.slice(0, 6)) {
    const res = await qe(get('/main/goods/getSearchList', { categoryId: cat._id, pageSize: 8 }))
    if (res?.data?.list?.length) {
      results.push({ categoryId: cat._id, categoryName: cat.name, products: res.data.list })
    }
  }
  categoryProducts.value = results
}

let flashTimer = null

onMounted(async () => {
  const [catRes, hotRes, recRes, banRes, newRes, bestRes, allRes, storesRes] = await Promise.all([
    get('/main/goodsCategory/getList'),
    get('/main/goods/getHotList'),
    get('/main/goods/getSearchList', { isRecommended: true, pageSize: 20 }),
    get('/main/banner/getList'),
    get('/main/goods/getSearchList', { sort: 'new', order: 'desc', pageSize: 10 }),
    get('/main/goods/getSearchList', { sort: 'sales', order: 'desc', pageSize: 10 }),
    get('/main/goods/getSearchList', { pageSize: 10 }),
    get('/main/userShop/getList', { pageSize: 8 }),
  ])
  if (catRes?.data) categories.value = catRes.data
  if (hotRes?.data) hotProducts.value = Array.isArray(hotRes.data) ? hotRes.data : hotRes.data.list || []
  if (recRes?.data) recommendedProducts.value = recRes.data.list || []
  if (banRes?.data) banners.value = Array.isArray(banRes.data) ? banRes.data : banRes.data.list || []
  if (newRes?.data) newArrivals.value = newRes.data.list || []
  if (bestRes?.data) bestSellers.value = bestRes.data.list || []
  if (allRes?.data?.list) {
    flashDeals.value = allRes.data.list.filter(p => p.originalPrice > p.minPrice).slice(0, 10)
  }
  if (storesRes?.data) stores.value = Array.isArray(storesRes.data) ? storesRes.data : storesRes.data.list || []

  if (catRes?.data) loadCategoryProducts(catRes.data)

  flashTime.value = 3600 * 8
  flashTimer = setInterval(() => {
    if (flashTime.value > 0) flashTime.value--
  }, 1000)
})

onBeforeUnmount(() => {
  if (flashTimer) clearInterval(flashTimer)
})
</script>

<style scoped>
.shein-home {
  background: #f5f5f5;
  min-height: 100vh;
}

.top-promo {
  background: linear-gradient(90deg, #1a1a2e, #16213e);
  color: #ffd700;
  text-align: center;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.hero-section {
  max-width: var(--g-main-width);
  margin: 0 auto;
  padding: 12px 16px 0;
}

.hero-slide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 60px;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
}

.hero-content {
  flex: 1;
  max-width: 520px;
}

.hero-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  color: #ffd700;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.hero-title {
  font-size: 38px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 12px;
  line-height: 1.2;
}

.hero-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.hero-btn {
  background: #ffd700;
  color: #1a1a2e;
  border: none;
  padding: 12px 40px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
  letter-spacing: 1px;
}

.hero-btn:hover {
  transform: scale(1.05);
}

.hero-visual {
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-visual img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3));
}

.section {
  max-width: var(--g-main-width);
  margin: 12px auto;
  padding: 0 16px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.section-head h2 {
  font-size: 20px;
  font-weight: 700;
  flex: 1;
}

.section-link {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}

.section-link:hover {
  color: #1a1a2e;
}

/* Category Strip */
.cat-strip {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.cat-strip-inner {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cat-strip-inner::-webkit-scrollbar {
  height: 0;
}

.cat-item {
  flex: 0 0 72px;
  text-align: center;
  cursor: pointer;
}

.cat-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
  font-size: 22px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cat-item:hover .cat-circle {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.cat-label {
  font-size: 11px;
  color: #333;
  display: block;
  line-height: 1.2;
}

/* Banner Row */
.banner-row {
  padding: 0 16px;
}

.banner-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 40px;
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  overflow: hidden;
}

.banner-card-sm {
  padding: 20px 32px;
}

.banner-text h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}

.banner-text p {
  font-size: 14px;
  opacity: 0.9;
}

.banner-img {
  height: 100px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* Horizontal Scroll */
.hscroll {
  overflow: hidden;
  margin: 0 -16px;
  padding: 0 16px;
}

.hscroll-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.hscroll-track::-webkit-scrollbar {
  height: 4px;
}

.hscroll-track::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

/* Product Card */
.prod-card {
  flex: 0 0 200px;
  scroll-snap-align: start;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.prod-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
}

.prod-img {
  width: 100%;
  aspect-ratio: 1;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.prod-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.prod-card:hover .prod-img img {
  transform: scale(1.05);
}

.qv-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; text-align: center; padding: 6px; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer; z-index: 3; }
.prod-card:hover .qv-overlay { opacity: 1; }

.discount-badge, .new-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
  z-index: 2;
}

.discount-badge {
  background: #999;
  color: #fff;
}

.new-badge {
  background: #2ecc71;
  color: #fff;
}

.prod-info {
  padding: 10px 12px 14px;
}

.prod-name {
  font-size: 13px;
  font-weight: 400;
  color: #333;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-price {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.curr-price {
  font-size: 17px;
  font-weight: 700;
  color: #999;
}

.old-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.prod-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

/* Flash Section */
.flash-section {
  background: var(--g-white);
  border-radius: 12px;
  padding: 16px;
}

.flash-icon {
  font-size: 24px;
}

.flash-timer {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timer-label {
  font-size: 12px;
  color: #999;
}

.timer-block {
  font-size: 18px;
  font-weight: 700;
  color: #999;
  background: rgba(153, 153, 153, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.flash-card .curr-price {
  color: #999;
}

/* Grid 4 column */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.grid-card {
  flex: unset;
}

/* Category Grid */
.cat-grid-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
}

.cat-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 12px 4px;
  border-radius: 8px;
  transition: background 0.2s;
  font-size: 12px;
  color: #333;
}

.cat-grid-item:hover {
  background: #f5f5f5;
}

.cat-grid-icon {
  font-size: 28px;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
  overflow: hidden;
}

.cat-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Store Card */
.stores-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.store-card {
  flex: 0 0 160px;
  scroll-snap-align: start;
  background: #fafafa;
  border-radius: 10px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.store-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
}

.store-logo-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 10px;
  background: #fff;
  border: 2px solid #eee;
}

.store-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-rating {
  font-size: 12px;
  color: #e67e22;
  margin-bottom: 2px;
}


/* Responsive */
@media (max-width: 1240px) {
  .section { padding: 0 12px; }
  .hero-section { padding: 12px 12px 0; }
}

@media (max-width: 1024px) {
  .hero-title { font-size: 30px; }
  .hero-visual { width: 240px; height: 240px; }
  .grid-4 { grid-template-columns: repeat(3, 1fr); }
  .cat-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .hero-slide { padding: 0 30px; flex-direction: column; justify-content: center; text-align: center; }
  .hero-visual { display: none; }
  .hero-content { max-width: 100%; }
  .hero-title { font-size: 26px; }
  .hero-btn { margin: 0 auto; }
  .prod-card { flex: 0 0 160px; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .cat-grid { grid-template-columns: repeat(3, 1fr); }
  .cat-strip-inner { gap: 14px; }
  .cat-item { flex: 0 0 60px; }
  .cat-circle { width: 48px; height: 48px; font-size: 18px; }
}

@media (max-width: 480px) {
  .prod-card { flex: 0 0 140px; }
  .prod-name { font-size: 12px; }
  .curr-price { font-size: 15px; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .cat-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cat-grid-item { font-size: 11px; }
  .cat-grid-icon { width: 44px; height: 44px; font-size: 22px; }
}
</style>
