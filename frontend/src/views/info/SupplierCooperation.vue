<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Supplier Cooperation</h1>
      <div class="info-content">
        <p class="info-lead">THE OUTNET values strong relationships with our suppliers. We seek partners who share our commitment to quality, authenticity, and customer satisfaction.</p>
        <h2>Becoming a Supplier</h2><p>We welcome partnerships with authorized retailers, brand distributors, and boutique owners who can provide authentic luxury fashion products.</p><h2>Requirements</h2><ul><li>Proof of authenticity and authorized distribution</li><li>Consistent inventory availability</li><li>Competitive pricing structure</li><li>Commitment to quality standards</li></ul><h2>Apply to Become a Supplier</h2><p>Email us at suppliers@theoutnet.com with your portfolio and brand list to start the application process.</p>
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
