<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Frequently Asked Questions</h1>
      <div class="info-content">
        <p class="info-lead">Find answers to the most common questions about shopping at THE OUTNET.</p>
        <h2>Orders & Shipping</h2><p><strong>How long does shipping take?</strong><br/>Standard shipping takes 5-10 business days. Express shipping is available in 2-3 business days.</p><p><strong>Do you ship internationally?</strong><br/>Yes, we ship to over 100 countries worldwide.</p><h2>Returns & Exchanges</h2><p><strong>What is your return policy?</strong><br/>We accept returns within 30 days of delivery. Items must be unworn with tags attached.</p><p><strong>How do I create a return?</strong><br/>Visit your order history and select "Create A Return" to start the process.</p><h2>Payments</h2><p><strong>What payment methods do you accept?</strong><br/>We accept Visa, Mastercard, American Express, PayPal, and more.</p><p><strong>Is my payment information secure?</strong><br/>Yes, we use industry-standard encryption to protect your payment information.</p>
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
