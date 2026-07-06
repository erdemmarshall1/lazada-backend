<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Download the App</h1>
      <div class="info-content">
        <p class="info-lead">Take THE OUTNET with you wherever you go. Download our mobile app for exclusive access to new arrivals, member-only offers, and seamless shopping.</p>
        <h2>App Features</h2><ul><li>Browse thousands of designer pieces</li><li>Get early access to new arrivals</li><li>Exclusive member-only offers</li><li>Secure checkout with fingerprint/Touch ID</li><li>Real-time order tracking</li><li>Personalized recommendations</li></ul><h2>Available On</h2><p><strong>iOS:</strong> Available on the App Store for iPhone and iPad</p><p><strong>Android:</strong> Available on Google Play for Android devices</p><h2>Download Now</h2><p>Scan the QR code or search "THE OUTNET" in your device's app store to download.</p>
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
