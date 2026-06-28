<template>
  <div class="c_footer">
    <div class="c-footer-container">
      <div class="c-footer-top">
        <div class="c-footer-top-list g-flex-align-center">
          <div class="c-footer-top-item g-flex-align-center" v-for="item in footerTopItems" :key="item.title">
            <div class="c-footer-top-item-icon g-flex-center">
              <i :class="item.icon"></i>
            </div>
            <div class="c-footer-top-item-title">{{ item.title }}</div>
          </div>
        </div>
      </div>
      <div class="c-footer-bottom">
        <div class="c-footer-bottom-title">Shopify Wholesale &copy; {{ year }}. All rights reserved.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
const footerTopItems = [
  { icon: 'iconfont icon-anquanbaozhang', title: 'Safe Payment' },
  { icon: 'iconfont icon-kefu', title: 'Customer Support' },
  { icon: 'iconfont icon-tuikuantuihuo', title: 'Free Returns' },
  { icon: 'iconfont icon-wuliu', title: 'Fast Delivery' },
]
</script>

<style scoped>
.c_footer { background: var(--g-footer-bg); margin-top: auto; }
.c_footer .c-footer-container { width: var(--g-main-width); margin: 0 auto; max-width: 100%; padding: 0 16px; }
.c_footer .c-footer-container .c-footer-top { margin: 0 auto 15px; padding-top: 8px; padding-bottom: 8px; height: 80px; position: relative; }
.c_footer .c-footer-container .c-footer-top:after { content: ""; position: absolute; width: 120%; left: 50%; transform: translate(-50%); bottom: 0; height: 1px; background: #d9d9d9; z-index: 10; }
.c_footer .c-footer-container .c-footer-top .c-footer-top-list { width: 100%; }
.c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item { width: 25%; justify-content: center; }
.c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item .c-footer-top-item-icon { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #696c7f; }
.c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item .c-footer-top-item-icon .iconfont { font-size: 22px; color: #696c7f; }
.c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item .c-footer-top-item-title { padding-left: 14px; font-size: 16px; font-weight: 700; color: #515a6e; }
.c_footer .c-footer-container .c-footer-bottom { padding: 15px 0; }
.c_footer .c-footer-container .c-footer-bottom .c-footer-bottom-title { text-align: center; color: #666; line-height: 30px; }
@media (max-width: 768px) {
  .c_footer .c-footer-container .c-footer-top { height: auto; padding: 12px 0; }
  .c_footer .c-footer-container .c-footer-top .c-footer-top-list { flex-wrap: wrap; gap: 8px; }
  .c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item { width: 48%; justify-content: flex-start; padding: 4px 0; }
  .c_footer .c-footer-container .c-footer-top .c-footer-top-list .c-footer-top-item .c-footer-top-item-title { font-size: 13px; }
}
</style>
