<template>
  <footer class="ton-footer">
    <div class="ton-footer-inner">
      <div class="ton-footer-grid">
        <div class="ton-footer-col">
          <img src="/img/outnet-logo.png" alt="THE OUTNET" class="ton-footer-logo" />
          <h4 class="ton-footer-title">ABOUT THE OUTNET</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/about-us')">About Us</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/join-us')">Join Us</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/contact-us')">Contact Us</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/exchange-cooperation')">Exchange and Cooperation</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/merchant-agreement')">Merchant Agreement</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/supplier-cooperation')">Supplier Cooperation</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/precision-operation')">Precision Operation</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/strategic-management')">Strategic Management</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/course-driven')">Course Driven</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/faq')">FAQ</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/download-app')">Download the App</a></li>
          </ul>
        </div>
        <div class="ton-footer-col">
          <h4 class="ton-footer-title">CUSTOMER CARE</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">Payment</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">Delivery</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">Exchanges &amp; Returns</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/ordertracking')">Track Your Order</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">Create A Return</a></li>
          </ul>
        </div>
        <div class="ton-footer-col">
          <h4 class="ton-footer-title">LEGAL</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">Privacy Notice</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">Terms &amp; Conditions</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">Cookie Notice</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">Return Policy</a></li>
          </ul>
        </div>
        <div class="ton-footer-col ton-footer-social">
          <h4 class="ton-footer-title">FOLLOW US</h4>
          <div class="ton-social-icons">
            <a href="https://facebook.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://instagram.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://youtube.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.5a29 29 0 00.46 5.08 2.78 2.78 0 001.94 2C5.12 19 12 19 12 19s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 11.5a29 29 0 00-.46-5.08z"/><polygon points="9.75 15.02 15.5 11.5 9.75 7.98 9.75 15.02"/></svg>
            </a>
            <a href="https://pinterest.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" aria-label="Pinterest">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15.5c0-1.12-.34-1.82-.72-2.18.72-.18 1.44-.88 1.44-1.72 0-1.06-.72-1.68-1.44-1.68-.86 0-1.56.64-1.56 1.68 0 .48.2 1.02.5 1.32-.54.24-1.06-.68-1.06-1.6 0-1.2.86-2.04 2.2-2.04 1.28 0 2.04.9 2.04 2 0 1.36-.72 2.2-1.6 2.2-.5 0-1-.38-1-.94 0-.18.04-.38.1-.52.1-.28.28-.68.36-.96.08-.3.06-.54 0-.76-.22-.64-.84-1.1-1.56-1.1-1.02 0-1.8.86-1.8 2.02 0 1.06.42 1.84 1.02 2.38.1.1.14.22.1.36l-.24.96c-.04.16-.2.22-.36.16-1.08-.44-1.8-1.6-1.8-2.92 0-1.98 1.44-3.8 3.96-3.8 2.12 0 3.7 1.52 3.7 3.54 0 2.12-1.34 3.82-3.18 3.82-.6 0-1.16-.3-1.36-.68l-.36 1.44c-.12.48-.48 1.08-.72 1.48.78.28 1.62.44 2.5.44 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </a>
          </div>
          <div class="ton-footer-newsletter">
            <h4 class="ton-footer-title">DOWNLOAD THE APP</h4>
            <p>Get early access to new arrivals and member-only offers.</p>
            <div class="ton-newsletter-form">
              <input type="email" placeholder="Email address" />
              <button class="ton-btn ton-btn--small" @click="$router.push('/download-app')">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div class="ton-footer-bottom">
        <p>&copy; {{ year }} THE OUTNET. All rights reserved.</p>
        <div class="ton-footer-payment">
          <span>VISA</span>
          <span>MC</span>
          <span>AMEX</span>
          <span>PAYPAL</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const year = new Date().getFullYear()
</script>

<style scoped>
.ton-footer { background: #faf8f4; border-top: 1px solid #e8e6e2; margin-top: auto; }
.ton-footer-inner { max-width: 1200px; margin: 0 auto; padding: 40px 20px 20px; }
.ton-footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 32px; margin-bottom: 32px; }
.ton-footer-logo { height: 24px; margin-bottom: 16px; display: block; }
.ton-footer-col h4 { font-size: 11px; letter-spacing: 1.5px; margin-bottom: 16px; font-weight: 400; }
.ton-footer-col ul { list-style: none; padding: 0; margin: 0; }
.ton-footer-col ul li { margin-bottom: 8px; }
.ton-footer-col ul li a { font-size: 13px; color: #555; text-decoration: none; cursor: pointer; }
.ton-footer-col ul li a:hover { color: #000; text-decoration: underline; }
.ton-social-icons { display: flex; gap: 8px; margin-bottom: 24px; }
.ton-social-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid #e8e6e2; border-radius: 50%; transition: background 0.2s; }
.ton-social-icon:hover { background: #e8e6e2; }
.ton-footer-newsletter p { font-size: 12px; color: #555; margin-bottom: 12px; line-height: 1.5; }
.ton-newsletter-form { display: flex; gap: 8px; }
.ton-newsletter-form input { flex: 1; height: 36px; padding: 0 12px; border: 1px solid #e8e6e2; font-size: 13px; background: #fff; outline: none; }
.ton-newsletter-form button { height: 36px; padding: 0 16px; background: #000; color: #fff; border: none; cursor: pointer; font-size: 11px; letter-spacing: 1px; }
.ton-newsletter-form button:hover { opacity: 0.8; }
.ton-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e8e6e2; }
.ton-footer-bottom p { font-size: 12px; color: #888; }
.ton-footer-payment { display: flex; gap: 16px; }
.ton-footer-payment span { font-size: 11px; color: #888; letter-spacing: 1px; font-weight: 600; }

@media (max-width: 768px) {
  .ton-footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
  .ton-footer-social { grid-column: 1 / -1; }
  .ton-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
}
@media (max-width: 480px) {
  .ton-footer-grid { grid-template-columns: 1fr; }
}
</style>
