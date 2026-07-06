<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Precision Operation</h1>
      <div class="info-content">
        <p class="info-lead">Precision Operation is at the heart of THE OUTNET's commitment to excellence. We leverage data-driven insights and advanced logistics to deliver a seamless experience.</p>
        <h2>Data-Driven Curation</h2><p>Our algorithms analyze market trends, customer preferences, and inventory data to curate the most relevant product selections for our customers.</p><h2>Advanced Logistics</h2><p>We utilize state-of-the-art warehousing and fulfillment systems to ensure fast, accurate delivery of every order.</p><h2>Quality Control</h2><p>Every item undergoes rigorous authentication and quality checks before being shipped to our customers.</p>
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
