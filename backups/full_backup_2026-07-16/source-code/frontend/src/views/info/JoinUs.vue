<template>
  <div class="info-page">
    <div class="info-container">
      <h1 class="info-title">Join THE OUTNET</h1>
      <div class="info-content">
        <p class="info-lead">Join the team that's reshaping luxury fashion. At THE OUTNET, we're looking for passionate individuals to help us deliver exceptional fashion experiences.</p>
        
        <h2>Why Work With Us</h2>
        <p>We believe in fostering a culture of innovation, inclusivity, and excellence. Our team members enjoy a collaborative environment where creativity thrives.</p>
        
        <h2>Current Opportunities</h2>
        <p>We're always looking for talent in the following areas:</p>
        <ul>
          <li>Technology & Engineering</li>
          <li>Fashion Curation & Buying</li>
          <li>Marketing & Communications</li>
          <li>Customer Experience</li>
          <li>Operations & Logistics</li>
        </ul>
        
        <h2>How to Apply</h2>
        <p>Send your resume and cover letter to careers@theoutnet.com. We look forward to hearing from you!</p>
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
