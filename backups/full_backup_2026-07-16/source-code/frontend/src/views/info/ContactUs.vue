<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Contact THE OUTNET</h1>
      <div class="info-content">
        <p class="info-lead">We'd love to hear from you. Whether you have a question about our products, your order, or anything else, our team is here to help.</p>
        <h2>Customer Service</h2><p>Email: support@theoutnet.com<br/>Phone: +1 (800) 123-4567<br/>Mon-Fri: 9AM-6PM EST</p><h2>Press Inquiries</h2><p>Email: press@theoutnet.com</p><h2>Partnerships</h2><p>Email: partnerships@theoutnet.com</p><h2>Office Address</h2><p>THE OUTNET<br/>123 Fashion Avenue<br/>New York, NY 10001<br/>United States</p>
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
