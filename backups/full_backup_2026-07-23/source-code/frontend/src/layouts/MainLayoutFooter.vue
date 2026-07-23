<template>
  <footer class="ton-footer">
    <div class="ton-footer-inner">
      <div class="ton-footer-grid">
        <div class="ton-footer-col">
          <h4 class="ton-footer-title">{{ $t('layout.footer.aboutTitle') }}</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/about-us')">{{ $t('layout.footer.aboutUs') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/join-us')">{{ $t('layout.footer.joinUs') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/contact-us')">{{ $t('layout.footer.contactUs') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/exchange-cooperation')">{{ $t('layout.footer.exchangeCooperation') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/merchant-agreement')">{{ $t('layout.footer.merchantAgreement') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/supplier-cooperation')">{{ $t('layout.footer.supplierCooperation') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/precision-operation')">{{ $t('layout.footer.precisionOperation') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/strategic-management')">{{ $t('layout.footer.strategicManagement') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/course-driven')">{{ $t('layout.footer.courseDriven') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/faq')">{{ $t('layout.footer.faq') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/download-app')">{{ $t('layout.footer.downloadApp') }}</a></li>
          </ul>
        </div>
        <div class="ton-footer-col">
          <h4 class="ton-footer-title">{{ $t('layout.footer.customerCareTitle') }}</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">{{ $t('layout.footer.payment') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">{{ $t('layout.footer.delivery') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">{{ $t('layout.footer.exchangesReturns') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/ordertracking')">{{ $t('layout.footer.trackOrder') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">{{ $t('layout.footer.createReturn') }}</a></li>
          </ul>
        </div>
        <div class="ton-footer-col">
          <h4 class="ton-footer-title">{{ $t('layout.footer.legalTitle') }}</h4>
          <ul>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">{{ $t('layout.footer.privacyNotice') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">{{ $t('layout.footer.termsConditions') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/rule')">{{ $t('layout.footer.cookieNotice') }}</a></li>
            <li><a href="javascript:void(0)" @click="$router.push('/myorder')">{{ $t('layout.footer.returnPolicy') }}</a></li>
          </ul>
        </div>
        <div class="ton-footer-col ton-footer-social">
          <h4 class="ton-footer-title">{{ $t('layout.footer.followUsTitle') }}</h4>
          <div class="ton-social-icons">
            <a href="https://facebook.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" :aria-label="$t('layout.footer.facebookAria')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://instagram.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" :aria-label="$t('layout.footer.instagramAria')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://youtube.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" :aria-label="$t('layout.footer.youtubeAria')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.5a29 29 0 00.46 5.08 2.78 2.78 0 001.94 2C5.12 19 12 19 12 19s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 11.5a29 29 0 00-.46-5.08z"/><polygon points="9.75 15.02 15.5 11.5 9.75 7.98 9.75 15.02"/></svg>
            </a>
            <a href="https://pinterest.com/theoutnet" target="_blank" rel="noopener" class="ton-social-icon" :aria-label="$t('layout.footer.pinterestAria')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15.5c0-1.12-.34-1.82-.72-2.18.72-.18 1.44-.88 1.44-1.72 0-1.06-.72-1.68-1.44-1.68-.86 0-1.56.64-1.56 1.68 0 .48.2 1.02.5 1.32-.54.24-1.06-.68-1.06-1.6 0-1.2.86-2.04 2.2-2.04 1.28 0 2.04.9 2.04 2 0 1.36-.72 2.2-1.6 2.2-.5 0-1-.38-1-.94 0-.18.04-.38.1-.52.1-.28.28-.68.36-.96.08-.3.06-.54 0-.76-.22-.64-.84-1.1-1.56-1.1-1.02 0-1.8.86-1.8 2.02 0 1.06.42 1.84 1.02 2.38.1.1.14.22.1.36l-.24.96c-.04.16-.2.22-.36.16-1.08-.44-1.8-1.6-1.8-2.92 0-1.98 1.44-3.8 3.96-3.8 2.12 0 3.7 1.52 3.7 3.54 0 2.12-1.34 3.82-3.18 3.82-.6 0-1.16-.3-1.36-.68l-.36 1.44c-.12.48-.48 1.08-.72 1.48.78.28 1.62.44 2.5.44 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </a>
          </div>
          <div class="ton-footer-newsletter">
            <h4 class="ton-footer-title">{{ $t('layout.footer.downloadAppTitle') }}</h4>
            <p>{{ $t('layout.footer.downloadAppDesc') }}</p>
            <div class="ton-newsletter-form">
              <input type="email" :placeholder="$t('layout.footer.emailPlaceholder')" />
              <button class="ton-btn ton-btn--small" @click="$router.push('/download-app')">{{ $t('layout.footer.subscribe') }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="ton-footer-bottom">
        <p>{{ $t('layout.footer.copyright', { year }) }}</p>
        <div class="ton-footer-payment">
          <span>{{ $t('layout.footer.visa') }}</span>
          <span>MC</span>
          <span>{{ $t('layout.footer.amex') }}</span>
          <span>{{ $t('layout.footer.paypal') }}</span>
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
.ton-footer { background: #ffffff; border-top: 1px solid #e9e9e9; margin-top: auto; font-family: 'TheOutnetWebXL', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; }
.ton-footer-inner { max-width: 1200px; margin: 0 auto; padding: 40px 20px 20px; }
.ton-footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 32px; margin-bottom: 32px; }
.ton-footer-col h4 { font-size: 11px; letter-spacing: 1.5px; margin-bottom: 16px; font-weight: 400; color: #192537; }
.ton-footer-col ul { list-style: none; padding: 0; margin: 0; }
.ton-footer-col ul li { margin-bottom: 8px; }
.ton-footer-col ul li a { font-size: 13px; color: #666; text-decoration: none; cursor: pointer; }
.ton-footer-col ul li a:hover { color: #ee4d2d; text-decoration: underline; }
.ton-social-icons { display: flex; gap: 8px; margin-bottom: 24px; }
.ton-social-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid #e9e9e9; border-radius: 50%; transition: all 0.2s; }
.ton-social-icon:hover { background: #ee4d2d; border-color: #ee4d2d; }
.ton-social-icon:hover svg { fill: #fff; }
.ton-footer-newsletter p { font-size: 12px; color: #666; margin-bottom: 12px; line-height: 1.5; }
.ton-newsletter-form { display: flex; gap: 8px; }
.ton-newsletter-form input { flex: 1; height: 36px; padding: 0 12px; border: 1px solid #e9e9e9; font-size: 13px; background: #fff; outline: none; border-radius: 6px; }
.ton-newsletter-form button { height: 36px; padding: 0 16px; background: linear-gradient(90deg, #ff3333, #0a68ff); color: #fff; border: none; cursor: pointer; font-size: 11px; letter-spacing: 1px; border-radius: 6px; transition: opacity 0.2s; }
.ton-newsletter-form button:hover { opacity: 0.8; }
.ton-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e9e9e9; }
.ton-footer-bottom p { font-size: 12px; color: #999; }
.ton-footer-payment { display: flex; gap: 16px; }
.ton-footer-payment span { font-size: 11px; color: #999; letter-spacing: 1px; font-weight: 600; }

@media (max-width: 768px) {
  .ton-footer-inner { padding: 24px 16px 16px; }
  .ton-footer-grid { grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .ton-footer-social { grid-column: 1 / -1; }
  .ton-social-icons { justify-content: flex-start; }
  .ton-newsletter-form { flex-direction: column; gap: 8px; }
  .ton-newsletter-form input { width: 100%; height: 40px; }
  .ton-newsletter-form button { width: 100%; height: 40px; }
  .ton-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
  .ton-footer-payment { justify-content: center; }
}
@media (max-width: 480px) {
  .ton-footer-grid { grid-template-columns: 1fr; }
  .ton-footer-col ul li { margin-bottom: 6px; }
  .ton-footer-col ul li a { font-size: 12px; }
  .ton-footer-col h4 { font-size: 10px; margin-bottom: 12px; }
}
</style>
