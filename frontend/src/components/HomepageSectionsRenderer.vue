<template>
  <div class="hp-sections">
    <div v-for="section in sections" :key="section._id" class="hp-section" :class="`hp-section-${section.type}`">
      <div class="hp-section-header" v-if="section.title">
        <h3 class="hp-section-title">{{ section.title }}</h3>
        <span class="hp-section-subtitle" v-if="section.subtitle">{{ section.subtitle }}</span>
      </div>

      <!-- Banner carousel -->
      <div class="hp-banner" v-if="section.type === 'banner' && images(section).length">
        <Swiper :modules="[SwiperAutoplay]" :slides-per-view="1" :loop="images(section).length > 1" :autoplay="{ delay: 5000 }">
          <SwiperSlide v-for="(img, i) in images(section)" :key="i">
            <img class="hp-banner-img" :src="$imgUrl(img)" alt="" @error="$imgFallback" />
          </SwiperSlide>
        </Swiper>
      </div>

      <!-- Product grid -->
      <div class="hp-product-grid" v-if="section.type === 'product_grid' && sectionProducts(section._id).length">
        <div class="home-goods-content" style="grid-template-columns: repeat(5, 1fr);">
          <div class="home-hots-item" v-for="item in sectionProducts(section._id)" :key="item._id" @click="$router.push('/gooddetail?id=' + item._id)">
            <img class="home-hots-img" :src="$imgUrl(item.images?.[0])" alt="" @error="$imgFallback" />
            <div class="home-hots-text">{{ item.name }}</div>
            <div class="home-hots-price">${{ formatPrice(item.minPrice || item.sales_price) }}</div>
          </div>
        </div>
      </div>

      <!-- Category grid -->
      <div class="hp-category-grid" v-if="section.type === 'category_grid'">
        <div class="hp-cat-items">
          <div class="hp-cat-item" v-for="cat in sectionCategories(section._id)" :key="cat._id" @click="$router.push('/secondsort?category_id=' + cat._id)">
            <span class="cat-emoji">{{ catIcon(cat.name) }}</span>
            <span class="hp-cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <!-- Featured (like Hot Products) -->
      <div class="hp-featured" v-if="section.type === 'featured' && sectionProducts(section._id).length">
        <div class="home-goods-content" style="grid-template-columns: repeat(5, 1fr);">
          <div class="home-hots-item" v-for="item in sectionProducts(section._id).slice(0, 10)" :key="item._id" @click="$router.push('/gooddetail?id=' + item._id)">
            <img class="home-hots-img" :src="$imgUrl(item.images?.[0])" alt="" @error="$imgFallback" />
            <div class="home-hots-text">{{ item.name }}</div>
            <div class="home-hots-price">${{ formatPrice(item.minPrice || item.sales_price) }}</div>
          </div>
        </div>
      </div>

      <!-- Promo bar -->
      <div class="hp-promo" v-if="section.type === 'promo_bar'">
        <a class="hp-promo-link" :href="promoLink(section)" target="_blank" v-if="promoLink(section)">
          {{ promoText(section) }}
        </a>
        <span class="hp-promo-text" v-else>{{ promoText(section) }}</span>
      </div>

      <!-- Custom HTML -->
      <div class="hp-custom" v-if="section.type === 'custom_html'" v-html="customHtml(section)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay as SwiperAutoplay } from 'swiper'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  sections: { type: Array, default: () => [] },
  productMap: { type: Object, default: () => ({}) },
  categories: { type: Array, default: () => [] },
})

const images = (section) => section.config?.images || []
const promoText = (section) => section.config?.text || section.title || ''
const promoLink = (section) => section.config?.link || ''
const customHtml = (section) => section.config?.html || ''

const catIcon = (name) => {
  const icons = { Electronics: '💻', Fashion: '👗', Home: '🏠', Beauty: '💄', Sports: '⚽', Books: '📚', Toys: '🧸', Food: '🍕', Automotive: '🚗', Health: '💊' }
  return icons[name] || '🛍️'
}

const sectionProducts = (sectionId) => props.productMap[sectionId] || []
const sectionCategories = (sectionId) => {
  const section = props.sections.find(s => s._id === sectionId)
  if (!section?.config?.categoryIds?.length) return props.categories
  return props.categories.filter(c => section.config.categoryIds.includes(c._id) || section.config.categoryIds.includes(c.category_id))
}

const routeDetail = (id) => `/gooddetail?id=${id}`
</script>

<style scoped>
.hp-section { margin-bottom: 24px; }
.hp-section-header { margin-bottom: 12px; }
.hp-section-title { font-size: 18px; font-weight: 700; color: #222; margin: 0; }
.hp-section-subtitle { font-size: 13px; color: #888; margin-left: 8px; }
.hp-banner-img { width: 100%; height: 320px; object-fit: cover; border-radius: 8px; }
.hp-cat-items { display: flex; gap: 12px; flex-wrap: wrap; }
.hp-cat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 20px; background: #f9f8f4; border: 1px solid #e8e6e2; border-radius: 8px; cursor: pointer; min-width: 100px; }
.hp-cat-item:hover { border-color: var(--g-main_color); }
.cat-emoji { font-size: 28px; }
.hp-cat-name { font-size: 13px; font-weight: 500; }
.hp-promo { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 14px 20px; border-radius: 8px; text-align: center; }
.hp-promo-link { color: #fff; font-weight: 600; text-decoration: underline; font-size: 15px; }
.hp-promo-text { font-size: 15px; font-weight: 500; }
.hp-custom { padding: 12px 0; }
</style>
