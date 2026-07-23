<template>
  <div class="rule-view">
    <div class="rule-container">
      <h2>Terms & Conditions</h2>
      <div class="rule-content">
        <h3>1. General Terms</h3>
        <p>By using this website, you agree to these terms and conditions.</p>
        <h3>2. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account and password.</p>
        <h3>3. Product Listings</h3>
        <p>Products are listed by sellers. We do not guarantee the accuracy of product information.</p>
        <h3>4. Payments</h3>
        <p>All payments are processed through the platform wallet system.</p>
        <h3>5. Shipping</h3>
        <p>Shipping times may vary depending on the seller and destination.</p>
        <h3>6. Returns & Refunds</h3>
        <p>Refund requests are processed according to our refund policy.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-view { flex: 1; background: var(--g-bg); padding: 20px 0; }
.rule-container { max-width: var(--g-main-width); margin: 0 auto; background: var(--g-white); border-radius: 8px; padding: 24px; }
.rule-content { margin-top: 20px; }
.rule-content h3 { font-size: 16px; margin: 16px 0 8px; }
.rule-content p { font-size: 14px; color: #666; line-height: 1.8; }
@media (max-width: 768px) {
  .rule-container { padding: 16px; margin: 0 12px; }
  .rule-content h3 { font-size: 15px; }
  .rule-content p { font-size: 13px; }
}
</style>
