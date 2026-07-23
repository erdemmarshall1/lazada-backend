<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Exchange and Cooperation</h1>
      <div class="info-content">
        <p class="info-lead">We believe in the power of collaboration. THE OUTNET partners with leading brands, designers, and retailers worldwide to bring you the best in luxury fashion.</p>
        <h2>Brand Partnerships</h2><p>We work directly with over 1,000 luxury brands to source authentic products at exceptional prices. Our brand partners trust us to represent their collections with integrity.</p><h2>Retail Partnerships</h2><p>We partner with premier retailers worldwide to offer a curated selection of overstock and past-season collections, giving our customers access to luxury fashion at accessible prices.</p><h2>How to Partner</h2><p>Interested in partnering with us? Reach out to our partnerships team at partnerships@theoutnet.com.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.info-page { flex: 1; background: #faf8f4; padding: 40px 0; min-height: 60vh; }
.info-container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 4px; padding: 48px; }
.info-title { font-size: 28px; font-weight: 300; letter-spacing: 3px; margin-bottom: 32px; color: #000; }
.info-lead { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 32px; }
.info-content h2 { font-size: 18px; font-weight: 600; letter-spacing: 1px; margin: 32px 0 16px; color: #000; }
.info-content p { font-size: 14px; line-height: 1.8; color: #555; margin-bottom: 16px; }
.info-content ul { list-style: none; padding: 0; }
.info-content ul li { font-size: 14px; line-height: 1.8; color: #555; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.info-content ul li:last-child { border-bottom: none; }
@media (max-width: 768px) {
  .info-page { padding: 20px 0; }
  .info-container { padding: 24px; margin: 0 12px; }
  .info-title { font-size: 22px; }
}
</style>
