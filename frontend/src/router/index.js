import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/main',
    children: [
      { path: 'main', name: 'main', component: () => import('@/views/home/MainView.vue'), meta: { title: 'Home' } },
      { path: 'login', name: 'login', component: () => import('@/views/auth/Login.vue'), meta: { title: 'Login' } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/Register.vue'), meta: { title: 'Register' } },
      { path: 'forgetpwd', name: 'forgetpwd', component: () => import('@/views/auth/ForgetPwd.vue'), meta: { title: 'Forgot Password' } },
      { path: 'setup-password', name: 'setup-password', component: () => import('@/views/auth/SetupPassword.vue'), meta: { title: 'Setup Password' } },
      { path: 'verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmail.vue'), meta: { title: 'Verify Email' } },
      { path: 'gooddetail', name: 'gooddetail', component: () => import('@/views/product/GoodDetail.vue'), meta: { title: 'Product Detail' } },
      { path: 'car', name: 'car', component: () => import('@/views/cart/Car.vue'), meta: { title: 'Cart', requiresAuth: true } },
      { path: 'tuijianlist', name: 'tuijianlist', component: () => import('@/views/product/TuiJianList.vue'), meta: { title: 'Recommended' } },
      { path: 'remenglist', name: 'remenglist', component: () => import('@/views/product/ReMengList.vue'), meta: { title: 'Hot Products' } },
      { path: 'shopjie', name: 'shopjie', component: () => import('@/views/store/ShopJie.vue'), meta: { title: 'Shop Street' } },
      { path: 'searchgoods', name: 'searchgoods', component: () => import('@/views/search/SearchGoods.vue'), meta: { title: 'Search' } },
      { path: 'searchstore', name: 'searchstore', component: () => import('@/views/search/SearchStore.vue'), meta: { title: 'Search Stores' } },
      { path: 'secondsort', name: 'secondsort', component: () => import('@/views/product/SecondSort.vue'), meta: { title: 'Category' } },
      { path: 'storedetail', name: 'storedetail', component: () => import('@/views/store/StoreDetail.vue'), meta: { title: 'Store' } },
      { path: 'createorder', name: 'createorder', component: () => import('@/views/order/CreateOrder.vue'), meta: { title: 'Create Order', requiresAuth: true } },
      { path: 'createcarorder', name: 'createcarorder', component: () => import('@/views/order/CreateCarOrder.vue'), meta: { title: 'Checkout', requiresAuth: true } },
      { path: 'paywait', name: 'paywait', component: () => import('@/views/order/PayWait.vue'), meta: { title: 'Payment' } },
      { path: 'sourcegoodsdetail', name: 'sourcegoodsdetail', component: () => import('@/views/wholesale/SourceGoodsDetail.vue'), meta: { title: 'Wholesale' } },
      { path: 'rule', name: 'rule', component: () => import('@/views/other/Rule.vue'), meta: { title: 'Terms' } },
      { path: 'miaoshalist', name: 'miaoshalist', component: () => import('@/views/product/MiaoShaList.vue'), meta: { title: 'Flash Sale' } },
      { path: 'about-us', name: 'about-us', component: () => import('@/views/info/AboutUs.vue'), meta: { title: 'About Us' } },
      { path: 'join-us', name: 'join-us', component: () => import('@/views/info/JoinUs.vue'), meta: { title: 'Join Us' } },
      { path: 'contact-us', name: 'contact-us', component: () => import('@/views/info/ContactUs.vue'), meta: { title: 'Contact Us' } },
      { path: 'contact', name: 'contact-form', component: () => import('@/views/info/ContactForm.vue'), meta: { title: 'Contact Form' } },
      { path: 'exchange-cooperation', name: 'exchange-cooperation', component: () => import('@/views/info/ExchangeCooperation.vue'), meta: { title: 'Exchange and Cooperation' } },
      { path: 'merchant-agreement', name: 'merchant-agreement', component: () => import('@/views/info/MerchantAgreement.vue'), meta: { title: 'Merchant Agreement' } },
      { path: 'supplier-cooperation', name: 'supplier-cooperation', component: () => import('@/views/info/SupplierCooperation.vue'), meta: { title: 'Supplier Cooperation' } },
      { path: 'precision-operation', name: 'precision-operation', component: () => import('@/views/info/PrecisionOperation.vue'), meta: { title: 'Precision Operation' } },
      { path: 'strategic-management', name: 'strategic-management', component: () => import('@/views/info/StrategicManagement.vue'), meta: { title: 'Strategic Management' } },
      { path: 'course-driven', name: 'course-driven', component: () => import('@/views/info/CourseDriven.vue'), meta: { title: 'Course Driven' } },
      { path: 'faq', name: 'faq', component: () => import('@/views/info/FaqPage.vue'), meta: { title: 'FAQ' } },
      { path: 'download-app', name: 'download-app', component: () => import('@/views/info/DownloadApp.vue'), meta: { title: 'Download the App' } },
      {
        path: 'mycenter',
        component: () => import('@/views/user/MyCenter.vue'),
        redirect: '/myaccount',
        meta: { requiresAuth: true },
        children: [
          { path: '/myaccount', name: 'myaccount', component: () => import('@/views/user/MyAccount.vue'), meta: { title: 'My Account', requiresAuth: true } },
          { path: '/balance', name: 'balance', component: () => import('@/views/user/Balance.vue'), meta: { title: 'Balance', requiresAuth: true } },
          { path: '/bankcardlist', name: 'bankcardlist', component: () => import('@/views/user/BankCardList.vue'), meta: { title: 'Bank Cards', requiresAuth: true } },
          { path: '/walletlist', name: 'walletlist', component: () => import('@/views/user/WalletList.vue'), meta: { title: 'Wallets', requiresAuth: true } },
          { path: '/addresslist', name: 'addresslist', component: () => import('@/views/user/AddressList.vue'), meta: { title: 'Addresses', requiresAuth: true } },
          { path: '/myorder', name: 'myorder', component: () => import('@/views/order/MyOrder.vue'), meta: { title: 'My Orders', requiresAuth: true } },
          { path: '/mybill', name: 'mybill', component: () => import('@/views/user/MyBill.vue'), meta: { title: 'My Bills', requiresAuth: true } },
          { path: '/rechargehistory', name: 'rechargehistory', component: () => import('@/views/user/RechargeHistory.vue'), meta: { title: 'Deposit', requiresAuth: true } },
          { path: '/cashouthistory', name: 'cashouthistory', component: () => import('@/views/user/CashoutHistory.vue'), meta: { title: 'Withdrawals', requiresAuth: true } },
          { path: '/applystore', name: 'applystore', component: () => import('@/views/store/ApplyStore.vue'), meta: { title: 'Apply Store', requiresAuth: true } },
          { path: '/applyconfirm', name: 'applyconfirm', component: () => import('@/views/store/ApplyConfirm.vue'), meta: { title: 'Application Status', requiresAuth: true } },
          { path: '/myfollowshop', name: 'myfollowshop', component: () => import('@/views/store/MyFollowShop.vue'), meta: { title: 'Followed Stores', requiresAuth: true } },
          { path: '/seehistory', name: 'seehistory', component: () => import('@/views/user/SeeHistory.vue'), meta: { title: 'History', requiresAuth: true } },
          { path: '/mywishlist', name: 'mywishlist', component: () => import('@/views/user/MyWishlist.vue'), meta: { title: 'Wishlist', requiresAuth: true } },
          { path: '/sourcegoods', name: 'sourcegoods', component: () => import('@/views/wholesale/SourceGoods.vue'), meta: { title: 'Source Goods', requiresAuth: true } },
          { path: '/ordertracking', name: 'ordertracking', component: () => import('@/views/logistics/OrderTracking.vue'), meta: { title: 'Track Order' } },
          { path: '/seller-logistics', name: 'seller-logistics', component: () => import('@/views/logistics/SellerLogistics.vue'), meta: { title: 'Seller Logistics', requiresAuth: true } },
          { path: '/mysubmissions', name: 'mysubmissions', component: () => import('@/views/user/MySubmissions.vue'), meta: { title: 'My Inquiries', requiresAuth: true } },
          { path: '/chattostore', name: 'chattostore', component: () => import('@/views/chat/ChatToStore.vue'), meta: { title: 'Chat Store', requiresAuth: true } },
          { path: '/chattostorelist', name: 'chattostorelist', component: () => import('@/views/chat/ChatToStoreList.vue'), meta: { title: 'Chats', requiresAuth: true } },
          { path: '/chattouserlist', name: 'chattouserlist', component: () => import('@/views/chat/ChatToUserList.vue'), meta: { title: 'User Chats', requiresAuth: true } },
          { path: '/chattouser', name: 'chattouser', component: () => import('@/views/chat/ChatToUser.vue'), meta: { title: 'Chat', requiresAuth: true } },
          { path: '/mystore', name: 'mystore', component: () => import('@/views/store/MyStore.vue'), meta: { title: 'My Store', requiresAuth: true } },
          { path: '/storeordercontrol', name: 'storeordercontrol', component: () => import('@/views/store/StoreOrderControl.vue'), meta: { title: 'Store Orders', requiresAuth: true } },
          { path: '/storegoodcontrol', name: 'storegoodcontrol', component: () => import('@/views/store/StoreGoodControl.vue'), meta: { title: 'Store Products', requiresAuth: true } },
          { path: '/internalmsg', name: 'internalmsg', component: () => import('@/views/message/InternalMsg.vue'), meta: { title: 'Messages', requiresAuth: true } },
          { path: '/admin-dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true } },
          { path: '/admin-sellers', name: 'admin-sellers', component: () => import('@/views/admin/AdminSellers.vue'), meta: { title: 'Sellers', requiresAuth: true } },
          { path: '/admin-products', name: 'admin-products', component: () => import('@/views/admin/AdminProducts.vue'), meta: { title: 'Products', requiresAuth: true } },
          { path: '/admin-transactions', name: 'admin-transactions', component: () => import('@/views/admin/AdminTransactions.vue'), meta: { title: 'Transactions', requiresAuth: true } },
          { path: '/admin-coupons', name: 'admin-coupons', component: () => import('@/views/admin/AdminCoupons.vue'), meta: { title: 'Coupons', requiresAuth: true } },
          { path: '/admin-users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: 'Users', requiresAuth: true } },
          { path: '/admin-invitation-codes', name: 'admin-invitation-codes', component: () => import('@/views/admin/AdminInvitationCodes.vue'), meta: { title: 'Invitation Codes', requiresAuth: true } },
          { path: '/admin-payment-settings', name: 'admin-payment-settings', component: () => import('@/views/admin/AdminPaymentSettings.vue'), meta: { title: 'Payment Settings', requiresAuth: true } },
          { path: '/admin-email-settings', name: 'admin-email-settings', component: () => import('@/views/admin/AdminEmailSettings.vue'), meta: { title: 'Email Settings', requiresAuth: true } },
          { path: '/admin-balance', name: 'admin-balance', component: () => import('@/views/admin/AdminBalanceManagement.vue'), meta: { title: 'Balance Management', requiresAuth: true } },
          { path: '/admin-platform-wallet', name: 'admin-platform-wallet', component: () => import('@/views/admin/AdminPlatformWallet.vue'), meta: { title: 'Platform Wallet', requiresAuth: true } },
          { path: '/changepassword', name: 'changepassword', component: () => import('@/views/user/ChangePassword.vue'), meta: { title: 'Change Password', requiresAuth: true } },
          { path: '/2fa', name: 'twofactor', component: () => import('@/views/user/TwoFactorAuth.vue'), meta: { title: 'Two-Factor Auth', requiresAuth: true } },
          { path: '/admin-theme-settings', name: 'admin-theme-settings', component: () => import('@/views/admin/AdminThemeSettings.vue'), meta: { title: 'Theme Settings', requiresAuth: true } },
          { path: '/superadmin-dashboard', name: 'superadmin-dashboard', component: () => import('@/views/admin/SuperAdminDashboard.vue'), meta: { title: 'Super Admin', requiresAuth: true } },
          { path: '/admin-banners', name: 'admin-banners', component: () => import('@/views/admin/AdminBanners.vue'), meta: { title: 'Banners', requiresAuth: true } },
          { path: '/admin-roles', name: 'admin-roles', component: () => import('@/views/admin/AdminRoles.vue'), meta: { title: 'Roles & Permissions', requiresAuth: true } },
          { path: '/admin-cms-pages', name: 'admin-cms-pages', component: () => import('@/views/admin/AdminPages.vue'), meta: { title: 'CMS Pages', requiresAuth: true } },
          { path: '/admin-cms-blogs', name: 'admin-cms-blogs', component: () => import('@/views/admin/AdminBlogs.vue'), meta: { title: 'CMS Blogs', requiresAuth: true } },
          { path: '/admin-cms-faqs', name: 'admin-cms-faqs', component: () => import('@/views/admin/AdminFaqs.vue'), meta: { title: 'CMS FAQs', requiresAuth: true } },
          { path: '/admin-cms-menus', name: 'admin-cms-menus', component: () => import('@/views/admin/AdminMenus.vue'), meta: { title: 'CMS Menus', requiresAuth: true } },
          { path: '/admin-reviews', name: 'admin-reviews', component: () => import('@/views/admin/AdminReviews.vue'), meta: { title: 'Review Moderation', requiresAuth: true } },
          { path: '/admin-reports', name: 'admin-reports', component: () => import('@/views/admin/AdminReports.vue'), meta: { title: 'Reports', requiresAuth: true } },
          { path: '/admin-homepage-sections', name: 'admin-homepage-sections', component: () => import('@/views/admin/AdminHomepageSections.vue'), meta: { title: 'Homepage Sections', requiresAuth: true } },
          { path: '/admin-settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettings.vue'), meta: { title: 'Settings', requiresAuth: true } },
          { path: '/admin-sessions-audit', name: 'admin-sessions-audit', component: () => import('@/views/admin/AdminSessionsAudit.vue'), meta: { title: 'Sessions & Audit', requiresAuth: true } },
          { path: '/privacysettings', name: 'privacysettings', component: () => import('@/views/user/PrivacySettings.vue'), meta: { title: 'Privacy & Security', requiresAuth: true } },
          { path: '/admin-user-privacy/:id', name: 'admin-user-privacy', component: () => import('@/views/admin/AdminUserPrivacy.vue'), meta: { title: 'User Privacy', requiresAuth: true } },
          { path: '/admin-submissions', name: 'admin-submissions', component: () => import('@/views/admin/AdminSubmissions.vue'), meta: { title: 'Inquiries', requiresAuth: true } },
          { path: '/admin-user-detail/:id', name: 'admin-user-detail', component: () => import('@/views/admin/AdminUserDetail.vue'), meta: { title: 'User Detail', requiresAuth: true } },
          { path: '/admin-shop-detail/:id', name: 'admin-shop-detail', component: () => import('@/views/admin/AdminShopDetail.vue'), meta: { title: 'Shop Detail', requiresAuth: true } },
          { path: '/admin-tawkto-settings', name: 'admin-tawkto-settings', component: () => import('@/views/admin/AdminTawkToSettings.vue'), meta: { title: 'Tawk.to Chat', requiresAuth: true } },
          { path: '/admin-livechat-inbox', name: 'admin-livechat-inbox', component: () => import('@/views/admin/AdminLiveChatInbox.vue'), meta: { title: 'Live Chat Inbox', requiresAuth: true } },
          { path: '/admin-livechat-settings', name: 'admin-livechat-settings', component: () => import('@/views/admin/AdminLiveChatSettings.vue'), meta: { title: 'Live Chat Settings', requiresAuth: true } },
        ],
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: 'Users', requiresAuth: true } },
      { path: 'sellers', name: 'admin-sellers', component: () => import('@/views/admin/AdminSellers.vue'), meta: { title: 'Sellers', requiresAuth: true } },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/AdminProducts.vue'), meta: { title: 'Products', requiresAuth: true } },
      { path: 'transactions', name: 'admin-transactions', component: () => import('@/views/admin/AdminTransactions.vue'), meta: { title: 'Transactions', requiresAuth: true } },
      { path: 'coupons', name: 'admin-coupons', component: () => import('@/views/admin/AdminCoupons.vue'), meta: { title: 'Coupons', requiresAuth: true } },
      { path: 'banners', name: 'admin-banners', component: () => import('@/views/admin/AdminBanners.vue'), meta: { title: 'Banners', requiresAuth: true } },
      { path: 'invitation-codes', name: 'admin-invitation-codes', component: () => import('@/views/admin/AdminInvitationCodes.vue'), meta: { title: 'Invitation Codes', requiresAuth: true } },
      { path: 'reviews', name: 'admin-reviews', component: () => import('@/views/admin/AdminReviews.vue'), meta: { title: 'Reviews', requiresAuth: true } },
      { path: 'roles', name: 'admin-roles', component: () => import('@/views/admin/AdminRoles.vue'), meta: { title: 'Roles & Permissions', requiresAuth: true } },
      { path: 'cms-pages', name: 'admin-cms-pages', component: () => import('@/views/admin/AdminPages.vue'), meta: { title: 'CMS Pages', requiresAuth: true } },
      { path: 'cms-blogs', name: 'admin-cms-blogs', component: () => import('@/views/admin/AdminBlogs.vue'), meta: { title: 'CMS Blogs', requiresAuth: true } },
      { path: 'cms-faqs', name: 'admin-cms-faqs', component: () => import('@/views/admin/AdminFaqs.vue'), meta: { title: 'CMS FAQs', requiresAuth: true } },
      { path: 'cms-menus', name: 'admin-cms-menus', component: () => import('@/views/admin/AdminMenus.vue'), meta: { title: 'CMS Menus', requiresAuth: true } },
      { path: 'reports', name: 'admin-reports', component: () => import('@/views/admin/AdminReports.vue'), meta: { title: 'Reports', requiresAuth: true } },
      { path: 'payment-settings', name: 'admin-payment-settings', component: () => import('@/views/admin/AdminPaymentSettings.vue'), meta: { title: 'Payment Settings', requiresAuth: true } },
      { path: 'email-settings', name: 'admin-email-settings', component: () => import('@/views/admin/AdminEmailSettings.vue'), meta: { title: 'Email Settings', requiresAuth: true } },
      { path: 'theme-settings', name: 'admin-theme-settings', component: () => import('@/views/admin/AdminThemeSettings.vue'), meta: { title: 'Theme Settings', requiresAuth: true } },
      { path: 'balance', name: 'admin-balance', component: () => import('@/views/admin/AdminBalanceManagement.vue'), meta: { title: 'Balance Management', requiresAuth: true } },
      { path: 'platform-wallet', name: 'admin-platform-wallet', component: () => import('@/views/admin/AdminPlatformWallet.vue'), meta: { title: 'Platform Wallet', requiresAuth: true } },
      { path: 'sessions-audit', name: 'admin-sessions-audit', component: () => import('@/views/admin/AdminSessionsAudit.vue'), meta: { title: 'Sessions & Audit', requiresAuth: true } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettings.vue'), meta: { title: 'Settings', requiresAuth: true } },
      { path: 'homepage-sections', name: 'admin-homepage-sections', component: () => import('@/views/admin/AdminHomepageSections.vue'), meta: { title: 'Homepage Sections', requiresAuth: true } },
      { path: 'submissions', name: 'admin-submissions', component: () => import('@/views/admin/AdminSubmissions.vue'), meta: { title: 'Inquiries', requiresAuth: true } },
      { path: 'tawkto-settings', name: 'admin-tawkto-settings', component: () => import('@/views/admin/AdminTawkToSettings.vue'), meta: { title: 'Tawk.to Chat', requiresAuth: true } },
      { path: 'livechat-inbox', name: 'admin-livechat-inbox', component: () => import('@/views/admin/AdminLiveChatInbox.vue'), meta: { title: 'Live Chat Inbox', requiresAuth: true } },
      { path: 'livechat-settings', name: 'admin-livechat-settings', component: () => import('@/views/admin/AdminLiveChatSettings.vue'), meta: { title: 'Live Chat Settings', requiresAuth: true } },
      { path: 'superadmin-dashboard', name: 'admin-superadmin-dashboard', component: () => import('@/views/admin/SuperAdminDashboard.vue'), meta: { title: 'Super Admin', requiresAuth: true } },
    ]
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/auth/AdminLogin.vue'),
    meta: { title: 'Admin Login' },
  },
  { path: '/refresh', name: 'refresh', component: () => import('@/views/other/Refresh.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/other/NotFound.vue'), meta: { title: '404' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const adminPathMap = {
  '/admin-dashboard': '/admin/dashboard', '/admin-users': '/admin/users', '/admin-sellers': '/admin/sellers',
  '/admin-products': '/admin/products', '/admin-transactions': '/admin/transactions', '/admin-coupons': '/admin/coupons',
  '/admin-banners': '/admin/banners', '/admin-invitation-codes': '/admin/invitation-codes', '/admin-reviews': '/admin/reviews',
  '/admin-roles': '/admin/roles', '/admin-cms-pages': '/admin/cms-pages', '/admin-cms-blogs': '/admin/cms-blogs',
  '/admin-cms-faqs': '/admin/cms-faqs', '/admin-cms-menus': '/admin/cms-menus', '/admin-reports': '/admin/reports',
  '/admin-payment-settings': '/admin/payment-settings', '/admin-email-settings': '/admin/email-settings',
  '/admin-theme-settings': '/admin/theme-settings', '/admin-balance': '/admin/balance',
  '/admin-platform-wallet': '/admin/platform-wallet', '/admin-sessions-audit': '/admin/sessions-audit',
  '/admin-settings': '/admin/settings', '/admin-homepage-sections': '/admin/homepage-sections',
  '/admin-submissions': '/admin/submissions', '/admin-tawkto-settings': '/admin/tawkto-settings',
  '/admin-livechat-inbox': '/admin/livechat-inbox', '/admin-livechat-settings': '/admin/livechat-settings',
  '/superadmin-dashboard': '/admin/superadmin-dashboard',
}

router.beforeEach((to, from, next) => {
  const store = useAppStore()

  if (to.query.temp_token) {
    localStorage.setItem('seller_temp_token', to.query.temp_token)
    store.setToken(to.query.temp_token)
    const { temp_token, ...rest } = to.query
    next({ path: to.path, query: rest })
    return
  }

  if (window.location.hostname.startsWith('admin') && to.path !== '/admin/login') {
    if (!store.isLogin) {
      if (to.path === '/' || to.path === '/main' || to.path === '/login') {
        next('/admin/login')
        return
      }
      if (to.matched.some(r => r.meta.requiresAuth)) {
        next('/admin/login')
        return
      }
    }
  }

  const redirectPath = adminPathMap[to.path]
  if (redirectPath) {
    next(redirectPath)
    return
  }

  window.scrollTo(0, 0)
  document.title = to.meta.title || 'Shopify Wholesale'

  if (to.name === 'login' && store.isLogin) {
    next('/main')
    return
  }
  if (to.name === 'admin-login' && store.isLogin) {
    next('/admin/dashboard')
    return
  }

  if (to.matched.some(r => r.meta.requiresAuth) && !store.isLogin) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (store.isLogin && store.userInfo?.needsPasswordSetup && to.name !== 'setup-password' && to.name !== 'login') {
    next({ name: 'setup-password' })
    return
  }

  next()
})

export default router
