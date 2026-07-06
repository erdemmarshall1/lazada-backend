<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">About THE OUTNET</h1>
      <div class="info-content">
        <p class="info-lead">THE OUTNET is the premier online destination for luxury fashion at accessible prices. We bring you a curated selection of designer pieces from the world's most coveted brands.</p>
        
        <h2>Our Story</h2>
        <p>Founded with a vision to make luxury fashion more accessible, THE OUTNET has grown into a global platform connecting fashion enthusiasts with authentic designer pieces at exceptional value.</p>
        <p>We partner directly with over 1,000 luxury brands and retailers to offer a constantly changing inventory of clothing, shoes, bags, and accessories.</p>
        
        <h2>Our Mission</h2>
        <p>To democratize luxury fashion by providing a trusted marketplace where customers can discover authentic designer pieces at prices that inspire joy.</p>
        
        <h2>Why Shop With Us</h2>
        <ul>
          <li><strong>Authenticity Guaranteed:</strong> Every item is verified authentic</li>
          <li><strong>Curated Selection:</strong> Hand-picked pieces from top designers</li>
          <li><strong>Global Shipping:</strong> Delivering to over 100 countries worldwide</li>
          <li><strong>Exceptional Value:</strong> Designer fashion at accessible prices</li>
        </ul>
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
.info-content ul li strong { color: #000; }
@media (max-width: 768px) {
  .info-page { padding: 20px 0; }
  .info-container { padding: 24px; margin: 0 12px; }
  .info-title { font-size: 22px; }
}
</style>




