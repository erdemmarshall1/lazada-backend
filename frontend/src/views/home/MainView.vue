<template>
  <div class="page">
    <div class="header-notice-box" v-if="affiches.length">
      <div class="hnb-left">
        <img class="hnb-img" src="/assets/notice-icon-D6jtWCg-.png" alt="notice" />
        <span class="hnb-text">Notice</span>
      </div>
      <div class="hnb-right">
        <div class="hnb-marquee" :style="{ animationDuration: affiches.length * 4 + 's' }">
          <span v-for="(item, i) in affiches" :key="i" class="hnb-marquee-item">{{ item.content }}</span>
        </div>
      </div>
    </div>

    <div class="page-main">
      <div class="main-content">
        <div class="mc-menu">
          <div class="mc-menu-item" v-for="cat in categories" :key="cat.category_id || cat._id" @click="goCategory(cat)">
            <div class="mc-menu-icon">
              <img class="icon" :src="catIconUrl(cat.pic || cat.icon)" alt="" @error="onIconError" />
            </div>
            <span class="mc-menu-text">{{ cat.name }}</span>
          </div>
        </div>

        <div class="mc-body">
          <div class="home-swiper">
            <Swiper
              :modules="[SwiperAutoplay, SwiperPagination, SwiperNavigation]"
              :slides-per-view="1"
              :loop="banners.length > 1"
              :autoplay="{ delay: 5000, disableOnInteraction: false }"
              :pagination="{ clickable: true }"
              :navigation="banners.length > 1"
              class="my-swipe"
            >
              <SwiperSlide v-for="(banner, idx) in banners" :key="idx">
                <img class="swipe-img" :src="imgUrl(banner.image)" :alt="banner.title || 'Banner ' + (idx + 1)" @error="onImgError" />
              </SwiperSlide>
            </Swiper>
          </div>

          <div class="home-quick">
            <div class="home-quick-links">
              <div class="quick-link-item" v-for="(cat, idx) in categories.slice(0, 10)" :key="idx" @click="goCategory(cat)">
                <img class="quick-link-img" :src="catIconUrl(cat.pic || cat.icon)" :alt="cat.name" @error="onIconError" />
                <div class="quick-link-text">{{ cat.name }}</div>
              </div>
            </div>
          </div>

          <div class="home-hots">
            <div class="home-hots-box">
              <div class="home-hots-operate">
                <div class="home-hots-title">Hot Products</div>
                <div class="home-hots-view" @click="$router.push('/remenglist')">View All</div>
              </div>
              <div class="home-hots-content">
                <div class="home-hots-item" v-for="item in hotProducts" :key="item._id" @click="goDetail(item._id)">
                  <img class="home-hots-img" :src="imgUrl(item.images?.[0])" :alt="item.name" @error="onImgError" />
                  <div class="home-hots-text">{{ item.name }}</div>
                  <div class="home-hots-price">${{ formatPrice(item.minPrice || item.sales_price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="home-hots" v-if="recommendedProducts.length">
            <div class="home-hots-box">
              <div class="home-hots-operate">
                <div class="home-hots-title" style="color: #27272a;">Recommended For You</div>
                <div class="home-hots-view" @click="$router.push('/tuijianlist')">View All</div>
              </div>
              <div class="home-goods-content">
                <div class="home-hots-item" v-for="item in recommendedProducts" :key="item._id" @click="goDetail(item._id)">
                  <img class="home-hots-img" :src="imgUrl(item.images?.[0])" :alt="item.name" @error="onImgError" />
                  <div class="home-hots-text">{{ item.name }}</div>
                  <div class="home-hots-price">${{ formatPrice(item.minPrice || item.sales_price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="home-hots" v-if="findProducts.length">
            <div class="home-hots-box">
              <div class="home-hots-operate">
                <div class="home-hots-title" style="color: #27272a;">Find Products</div>
                <div class="home-hots-view" @click="$router.push('/searchgoods')">View All</div>
              </div>
              <div class="home-goods-content" style="grid-template-columns: repeat(4, 1fr); height: auto;">
                <div class="home-hots-item" v-for="item in findProducts" :key="item._id" @click="goDetail(item._id)">
                  <img class="home-hots-img" :src="imgUrl(item.images?.[0])" :alt="item.name" @error="onImgError" />
                  <div class="home-hots-text">{{ item.name }}</div>
                  <div class="home-hots-price">${{ formatPrice(item.minPrice || item.sales_price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="home-shop" v-if="merchants.length">
            <div class="home-shop-title">Credit Merchants</div>
            <div class="home-shop-box">
              <div class="home-shop-item" v-for="(m, idx) in merchants" :key="idx">
                <div class="home-shop-img-box">
                  <img class="home-shop-img" :src="imgUrl(m.product_img)" alt="" @error="onImgError" />
                </div>
                <div class="home-shop-icon-box">
                  <img class="home-shop-icon" :src="imgUrl(m.mer_avatar)" :alt="m.mer_name" @error="onImgError" />
                </div>
                <div class="home-shop-text">{{ m.mer_name }}</div>
              </div>
            </div>
          </div>

          <div class="home-footer">
            <div class="home-footer-item">
              <img class="home-footer-img" src="/assets/logo-icon-o8aSW2Vd.png" alt="logo" />
              <div class="home-footer-title">THE OUTNET CN</div>
              <div class="home-footer-tips">Luxury fashion at wholesale prices</div>
            </div>
            <div class="home-footer-item">
              <img class="home-footer-img" src="/assets/notice-icon-D6jtWCg-.png" alt="support" />
              <div class="home-footer-title">24/7 Support</div>
              <div class="home-footer-tips">Customer care available around the clock</div>
            </div>
            <div class="home-footer-item">
              <img class="home-footer-img" src="/assets/logo-icon-o8aSW2Vd.png" alt="shipping" />
              <div class="home-footer-title">Free Shipping</div>
              <div class="home-footer-tips">On orders over $500</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import SwiperCore, { Autoplay, Pagination, Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { get } from '@/api/request'

const router = useRouter()

const SwiperAutoplay = Autoplay
const SwiperPagination = Pagination
const SwiperNavigation = Navigation

const categories = ref([])
const banners = ref([])
const hotProducts = ref([])
const recommendedProducts = ref([])
const findProducts = ref([])
const merchants = ref([])
const affiches = ref([])

const CATEGORY_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23808089"%3E%3Cpath d="M4 4h16v16H4z" opacity=".3"/%3E%3C/svg%3E'
const IMG_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"%3E%3Crect fill="%23f4f2ee" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23999" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E'

const imgUrl = (url) => {
  if (!url) return IMG_FALLBACK
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/') || url.startsWith('/assets/')) {
    const base = import.meta.env.VITE_API_BASE_URL || ''
    return base + url
  }
  return url
}

const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00'
  if (typeof price === 'string') return price
  return Number(price).toFixed(2)
}

const catIconUrl = (pic) => {
  if (!pic) return CATEGORY_FALLBACK
  if (pic.startsWith('http://') || pic.startsWith('https://')) return pic
  const base = import.meta.env.VITE_API_BASE_URL || ''
  if (pic.startsWith('/uploads/')) return base + pic
  return pic
}

const onIconError = (e) => { e.target.src = CATEGORY_FALLBACK }
const onImgError = (e) => { e.target.src = IMG_FALLBACK }

const goCategory = (cat) => {
  if (cat.category_id) {
    router.push('/secondsort?categoryId=' + cat.category_id)
  } else if (cat._id) {
    router.push('/secondsort?categoryId=' + cat._id)
  } else {
    router.push('/searchgoods')
  }
}

const goDetail = (id) => {
  router.push('/gooddetail?id=' + id)
}

onMounted(async () => {
  const [catRes, banRes, hotRes, recRes, findRes, merchRes, affRes] = await Promise.all([
    get('/main/goodsCategory/getList').catch(() => ({ data: null })),
    get('/main/banner/getList').catch(() => ({ data: null })),
    get('/main/goods/getHotList').catch(() => ({ data: null })),
    get('/main/goods/getSearchList', { isRecommended: true, pageSize: 20 }).catch(() => ({ data: null })),
    get('/main/goods/getSearchList', { pageSize: 20 }).catch(() => ({ data: null })),
    get('/main/userShop/getCreditMerchantList').catch(() => ({ data: null })),
    get('/main/msg/getAlertList').catch(() => ({ data: null })),
  ])

  if (catRes?.data) categories.value = Array.isArray(catRes.data) ? catRes.data : []
  if (banRes?.data) banners.value = Array.isArray(banRes.data) ? banRes.data : banRes.data.list || []
  if (hotRes?.data) hotProducts.value = Array.isArray(hotRes.data) ? hotRes.data : hotRes.data.list || []
  if (recRes?.data) recommendedProducts.value = recRes.data.list || []
  if (findRes?.data) findProducts.value = findRes.data.list || []
  if (merchRes?.data) merchants.value = Array.isArray(merchRes.data) ? merchRes.data : merchRes.data.list || []
  if (affRes?.data) affiches.value = Array.isArray(affRes.data) ? affRes.data : []
})
</script>

<style scoped>
.page {
  width: 100dvw;
  background: #f7f7f7;
  overflow: visible;
}

.header-notice-box {
  display: flex;
  align-items: stretch;
  margin: 0 auto;
  padding: 8px 12px;
  width: 1200px;
  background: #f2f7ff;
  border-radius: 0 0 8px 8px;
  gap: 12px;
  overflow: hidden;
}

.hnb-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
}

.hnb-img {
  width: 27px;
  height: 12px;
  object-fit: cover;
}

.hnb-text {
  font-size: 10px;
  font-weight: 600;
  color: #003ea1;
}

.hnb-right {
  height: 24px;
  width: 100%;
  overflow: hidden;
}

.hnb-marquee {
  display: inline-flex;
  gap: 60px;
  white-space: nowrap;
  animation: marquee linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.hnb-marquee-item {
  font-size: 10px;
  color: #003ea1;
  font-weight: 500;
}

.page-main {
  display: flex;
  justify-content: center;
  min-width: 1200px;
  padding: 12px 0;
  min-height: calc(100% - 126px);
}

.main-content {
  position: relative;
  display: flex;
  width: 1200px;
  gap: 24px;
  overflow: hidden;
}

.mc-menu {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 12px 8px;
  width: 230px;
  height: min-content;
  background-color: #fff;
  border-radius: 8px;
  box-sizing: border-box;
}

.mc-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: .3s;
}

.mc-menu-item:hover {
  box-shadow: 1px 0 5px #b9b8b8;
}

.mc-menu-icon {
  width: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-menu-icon .icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.mc-menu-text {
  margin-left: 6px;
  color: #808089;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.mc-body {
  width: calc(100% - 250px);
  overflow-x: hidden;
}

.home-swiper {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
  border-radius: 8px;
  background-color: #fff;
}

.home-swiper .my-swipe {
  position: relative;
  width: 100%;
}

.home-swiper .swipe-img {
  width: 100%;
  max-height: 400px;
  border-radius: 12px;
  object-fit: cover;
}

.home-quick {
  display: flex;
  margin: 12px 0;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
  border-radius: 8px;
  background-color: #fff;
  overflow: hidden;
}

.home-quick-links {
  display: flex;
  width: 100%;
  gap: 6px;
}

.quick-link-item {
  width: 100%;
  cursor: pointer;
  text-align: center;
}

.quick-link-item .quick-link-img {
  margin: 0 auto;
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 35%;
}

.quick-link-item .quick-link-text {
  margin-top: 4px;
  font-size: 12px;
  line-height: 15px;
  color: #27272a;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 500;
  text-align: center;
}

.home-hots {
  margin-bottom: 12px;
  border-radius: 8px;
  background-color: #fff;
}

.home-hots-box {
  padding: 12px 16px;
}

.home-hots-box .home-hots-operate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.home-hots-box .home-hots-operate .home-hots-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 150%;
  color: #d93843;
}

.home-hots-box .home-hots-operate .home-hots-view {
  font-weight: 500;
  font-size: 14px;
  line-height: 150%;
  color: #0a68ff;
  cursor: pointer;
}

.home-hots-box .home-hots-content {
  display: grid;
  gap: 8px;
  grid-auto-flow: column;
  grid-auto-columns: 145px;
  grid-template-columns: repeat(auto-fill, 145px);
  grid-template-rows: repeat(1, 1fr);
  overflow-x: auto;
  scroll-behavior: smooth;
  min-height: 222px;
  height: 222px;
}

.home-hots-box .home-goods-content {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-columns: 50%;
  height: auto;
}

.home-hots-box .home-hots-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 222px;
  border: 1px solid rgb(235, 235, 240);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: .3s;
}

.home-hots-box .home-hots-item:hover {
  box-shadow: #0000001a 0 0 20px;
}

.home-hots-box .home-hots-item .home-hots-img {
  margin: auto;
  width: 80%;
  height: 136px;
  object-fit: contain;
}

.home-hots-box .home-hots-item .home-hots-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-self: stretch;
  overflow: hidden;
  color: #27272a;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 400;
  line-height: 150%;
  padding: 8px 8px 0;
  word-break: break-word;
}

.home-hots-box .home-hots-item .home-hots-price {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 150%;
  color: #d93843;
  text-align: left;
}

.home-shop {
  margin-bottom: 12px;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 8px;
}

.home-shop .home-shop-title {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  color: #27272a;
}

.home-shop .home-shop-box {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
  min-height: 192px;
}

.home-shop .home-shop-box .home-shop-item {
  flex-shrink: 0;
  width: 150px;
  margin-right: 8px;
  padding-bottom: 12px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, .05);
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: .3s;
}

.home-shop .home-shop-box .home-shop-item:hover {
  box-shadow: #0000001a 0 0 20px;
}

.home-shop .home-shop-box .home-shop-item .home-shop-img-box {
  padding: 4px;
  width: 100%;
}

.home-shop .home-shop-box .home-shop-item .home-shop-img-box .home-shop-img {
  width: 100%;
  height: 100px;
  object-fit: contain;
}

.home-shop .home-shop-box .home-shop-item .home-shop-icon-box {
  margin: 0 auto;
  width: 90%;
  height: 44px;
  overflow: hidden;
  border: .5px solid rgba(0, 0, 0, .09);
  border-radius: 20px;
}

.home-shop .home-shop-box .home-shop-item .home-shop-icon-box .home-shop-icon {
  margin: auto;
  width: 70%;
  max-height: 40px;
  object-fit: contain;
}

.home-shop .home-shop-box .home-shop-item .home-shop-text {
  padding: 10px 5px 0;
  font-size: 14px;
  color: #ee0a24;
  font-weight: 700;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.home-footer .home-footer-item {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  text-align: center;
}

.home-footer .home-footer-item .home-footer-img {
  width: 100%;
  height: 192px;
  object-fit: contain;
}

.home-footer .home-footer-item .home-footer-title {
  margin-top: 20px;
  padding-bottom: 14px;
  font-size: 22px;
  color: #0a68ff;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-align: center;
}

.home-footer .home-footer-item .home-footer-tips {
  opacity: .7;
  font-size: 14px;
  color: #192537;
  letter-spacing: .4px;
  line-height: 26px;
  text-align: center;
}
</style>
