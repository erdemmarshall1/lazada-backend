<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Strategic Management</h1>
      <div class="info-content">
        <p class="info-lead">Our strategic management approach drives sustainable growth and market leadership in the luxury fashion e-commerce space.</p>
        <h2>Vision & Strategy</h2><p>We are committed to becoming the world's most trusted destination for accessible luxury fashion, guided by our core values of authenticity, accessibility, and excellence.</p><h2>Market Leadership</h2><p>Through strategic partnerships, innovative technology, and customer-centric initiatives, we continue to expand our global footprint.</p><h2>Sustainability</h2><p>We are committed to sustainable practices across our operations, from responsible sourcing to eco-friendly packaging initiatives.</p>
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
