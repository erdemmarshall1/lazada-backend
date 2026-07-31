import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAdminAppStore } from '@/stores/adminApp'

const routes = [
  {
    path: '/countries',
    name: 'countries',
    component: () => import('@/views/landing/CountrySelection.vue'),
    meta: { title: 'Select Your Country' }
  },
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
      { path: 'just-in', name: 'just-in', component: () => import('@/views/category/JustIn.vue'), meta: { title: 'Just In' } },
      { path: 'designers', name: 'designers', component: () => import('@/views/category/Designers.vue'), meta: { title: 'Designers' } },
      { path: 'categories/:slug', name: 'categories', component: () => import('@/views/category/CategoryProducts.vue'), meta: { title: 'Category' } },
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
          { path: '/storesettings', name: 'storesettings', component: () => import('@/views/store/StoreSettings.vue'), meta: { title: 'Store Settings', requiresAuth: true } },
          { path: '/mystore', name: 'mystore', component: () => import('@/views/store/MyStore.vue'), meta: { title: 'My Store', requiresAuth: true } },
          { path: '/storeordercontrol', name: 'storeordercontrol', component: () => import('@/views/store/StoreOrderControl.vue'), meta: { title: 'Store Orders', requiresAuth: true } },
          { path: '/storegoodcontrol', name: 'storegoodcontrol', component: () => import('@/views/store/StoreGoodControl.vue'), meta: { title: 'Store Products', requiresAuth: true } },
          { path: '/internalmsg', name: 'internalmsg', component: () => import('@/views/message/InternalMsg.vue'), meta: { title: 'Messages', requiresAuth: true } },
          { path: '/myconsultations', name: 'myconsultations', component: () => import('@/views/user/MyConsultations.vue'), meta: { title: 'My Consultations', requiresAuth: true } },
          { path: '/admin-dashboard', name: 'mycenter-admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true } },
          { path: '/admin-sellers', name: 'mycenter-admin-sellers', component: () => import('@/views/admin/AdminSellers.vue'), meta: { title: 'Sellers', requiresAuth: true } },
          { path: '/admin-products', name: 'mycenter-admin-products', component: () => import('@/views/admin/AdminProducts.vue'), meta: { title: 'Products', requiresAuth: true } },
          { path: '/admin-transactions', name: 'mycenter-admin-transactions', component: () => import('@/views/admin/AdminTransactions.vue'), meta: { title: 'Transactions', requiresAuth: true } },
          { path: '/admin-coupons', name: 'mycenter-admin-coupons', component: () => import('@/views/admin/AdminCoupons.vue'), meta: { title: 'Coupons', requiresAuth: true } },
          { path: '/admin-users', name: 'mycenter-admin-users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: 'Users', requiresAuth: true } },
          { path: '/admin-invitation-codes', name: 'mycenter-admin-invitation-codes', component: () => import('@/views/admin/AdminInvitationCodes.vue'), meta: { title: 'Invitation Codes', requiresAuth: true } },
          { path: '/admin-payment-settings', name: 'mycenter-admin-payment-settings', component: () => import('@/views/admin/AdminPaymentSettings.vue'), meta: { title: 'Payment Settings', requiresAuth: true } },
          { path: '/admin-email-settings', name: 'mycenter-admin-email-settings', component: () => import('@/views/admin/AdminEmailSettings.vue'), meta: { title: 'Email Settings', requiresAuth: true } },
          { path: '/admin-balance', name: 'mycenter-admin-balance', component: () => import('@/views/admin/AdminBalanceManagement.vue'), meta: { title: 'Balance Management', requiresAuth: true } },
          { path: '/admin-platform-wallet', name: 'mycenter-admin-platform-wallet', component: () => import('@/views/admin/AdminPlatformWallet.vue'), meta: { title: 'Platform Wallet', requiresAuth: true } },
          { path: '/changepassword', name: 'changepassword', component: () => import('@/views/user/ChangePassword.vue'), meta: { title: 'Change Password', requiresAuth: true } },
          { path: '/2fa', name: 'twofactor', component: () => import('@/views/user/TwoFactorAuth.vue'), meta: { title: 'Two-Factor Auth', requiresAuth: true } },
          { path: '/admin-theme-settings', name: 'mycenter-admin-theme-settings', component: () => import('@/views/admin/AdminThemeSettings.vue'), meta: { title: 'Theme Settings', requiresAuth: true } },
          { path: '/superadmin-dashboard', name: 'mycenter-superadmin-dashboard', component: () => import('@/views/admin/SuperAdminDashboard.vue'), meta: { title: 'Super Admin', requiresAuth: true } },
          { path: '/admin-banners', name: 'mycenter-admin-banners', component: () => import('@/views/admin/AdminBanners.vue'), meta: { title: 'Banners', requiresAuth: true } },
          { path: '/admin-roles', name: 'mycenter-admin-roles', component: () => import('@/views/admin/AdminRoles.vue'), meta: { title: 'Roles & Permissions', requiresAuth: true } },
          { path: '/admin-cms-pages', name: 'mycenter-admin-cms-pages', component: () => import('@/views/admin/AdminPages.vue'), meta: { title: 'CMS Pages', requiresAuth: true } },
          { path: '/admin-cms-blogs', name: 'mycenter-admin-cms-blogs', component: () => import('@/views/admin/AdminBlogs.vue'), meta: { title: 'CMS Blogs', requiresAuth: true } },
          { path: '/admin-cms-faqs', name: 'mycenter-admin-cms-faqs', component: () => import('@/views/admin/AdminFaqs.vue'), meta: { title: 'CMS FAQs', requiresAuth: true } },
          { path: '/admin-cms-menus', name: 'mycenter-admin-cms-menus', component: () => import('@/views/admin/AdminMenus.vue'), meta: { title: 'CMS Menus', requiresAuth: true } },
          { path: '/admin-reviews', name: 'mycenter-admin-reviews', component: () => import('@/views/admin/AdminReviews.vue'), meta: { title: 'Review Moderation', requiresAuth: true } },
          { path: '/admin-reports', name: 'mycenter-admin-reports', component: () => import('@/views/admin/AdminReports.vue'), meta: { title: 'Reports', requiresAuth: true } },
          { path: '/admin-homepage-sections', name: 'mycenter-admin-homepage-sections', component: () => import('@/views/admin/AdminHomepageSections.vue'), meta: { title: 'Homepage Sections', requiresAuth: true } },
          { path: '/admin-settings', name: 'mycenter-admin-settings', component: () => import('@/views/admin/AdminSettings.vue'), meta: { title: 'Settings', requiresAuth: true } },
          { path: '/admin-sessions-audit', name: 'mycenter-admin-sessions-audit', component: () => import('@/views/admin/AdminSessionsAudit.vue'), meta: { title: 'Sessions & Audit', requiresAuth: true } },
          { path: '/privacysettings', name: 'privacysettings', component: () => import('@/views/user/PrivacySettings.vue'), meta: { title: 'Privacy & Security', requiresAuth: true } },
          { path: '/admin-user-privacy/:id', name: 'mycenter-admin-user-privacy', component: () => import('@/views/admin/AdminUserPrivacy.vue'), meta: { title: 'User Privacy', requiresAuth: true } },
          { path: '/admin-submissions', name: 'mycenter-admin-submissions', component: () => import('@/views/admin/AdminSubmissions.vue'), meta: { title: 'Inquiries', requiresAuth: true } },
          { path: '/admin-user-detail/:id', name: 'mycenter-admin-user-detail', component: () => import('@/views/admin/AdminUserDetail.vue'), meta: { title: 'User Detail', requiresAuth: true } },
          { path: '/admin-shop-detail/:id', name: 'mycenter-admin-shop-detail', component: () => import('@/views/admin/AdminShopDetail.vue'), meta: { title: 'Shop Detail', requiresAuth: true } },
          { path: '/admin-livechat-inbox', name: 'mycenter-admin-livechat-inbox', component: () => import('@/views/admin/AdminLiveChatInbox.vue'), meta: { title: 'Live Chat Inbox', requiresAuth: true } },
          { path: '/admin-livechat-settings', name: 'mycenter-admin-livechat-settings', component: () => import('@/views/admin/AdminLiveChatSettings.vue'), meta: { title: 'Live Chat Settings', requiresAuth: true } },
          { path: '/admin-seller-id-settings', name: 'mycenter-admin-seller-id-settings', component: () => import('@/views/admin/AdminSellerIdSettings.vue'), meta: { title: 'Seller ID Settings', requiresAuth: true } },
        ],
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminRouterWrapper.vue'),
    children: [
      { path: '', name: 'admin-login', component: () => import('@/views/auth/AdminLogin.vue'), meta: { title: 'Admin Login' } },
      { path: 'login', redirect: '/admin' },
      { path: 'forgetpwd', name: 'admin-forgetpwd', component: () => import('@/views/auth/ForgetPwd.vue'), meta: { title: 'Forgot Password' } },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true, adminLayout: true } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { title: 'Users', requiresAuth: true, adminLayout: true } },
      { path: 'users/edit/:id', name: 'admin-user-edit', component: () => import('@/views/admin/AdminUserEdit.vue'), meta: { title: 'Edit User', requiresAuth: true, adminLayout: true } },
      { path: 'users/detail/:id', name: 'admin-user-detail', component: () => import('@/views/admin/AdminUserDetail.vue'), meta: { title: 'User Detail', requiresAuth: true, adminLayout: true } },
      { path: 'users/privacy/:id', name: 'admin-user-privacy', component: () => import('@/views/admin/AdminUserPrivacy.vue'), meta: { title: 'User Privacy', requiresAuth: true, adminLayout: true } },
      { path: 'shop-detail/:id', name: 'admin-shop-detail', component: () => import('@/views/admin/AdminShopDetail.vue'), meta: { title: 'Shop Detail', requiresAuth: true, adminLayout: true } },
      { path: 'sellers', name: 'admin-sellers', component: () => import('@/views/admin/AdminSellers.vue'), meta: { title: 'Sellers', requiresAuth: true, adminLayout: true } },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/AdminProducts.vue'), meta: { title: 'Products', requiresAuth: true, adminLayout: true } },
      { path: 'transactions', name: 'admin-transactions', component: () => import('@/views/admin/AdminTransactions.vue'), meta: { title: 'Transactions', requiresAuth: true, adminLayout: true } },
      { path: 'coupons', name: 'admin-coupons', component: () => import('@/views/admin/AdminCoupons.vue'), meta: { title: 'Coupons', requiresAuth: true, adminLayout: true } },
      { path: 'banners', name: 'admin-banners', component: () => import('@/views/admin/AdminBanners.vue'), meta: { title: 'Banners', requiresAuth: true, adminLayout: true } },
      { path: 'invitation-codes', name: 'admin-invitation-codes', component: () => import('@/views/admin/AdminInvitationCodes.vue'), meta: { title: 'Invitation Codes', requiresAuth: true, adminLayout: true } },
      { path: 'reviews', name: 'admin-reviews', component: () => import('@/views/admin/AdminReviews.vue'), meta: { title: 'Reviews', requiresAuth: true, adminLayout: true } },
      { path: 'roles', name: 'admin-roles', component: () => import('@/views/admin/AdminRoles.vue'), meta: { title: 'Roles & Permissions', requiresAuth: true, adminLayout: true } },
      { path: 'cms-pages', name: 'admin-cms-pages', component: () => import('@/views/admin/AdminPages.vue'), meta: { title: 'CMS Pages', requiresAuth: true, adminLayout: true } },
      { path: 'cms-blogs', name: 'admin-cms-blogs', component: () => import('@/views/admin/AdminBlogs.vue'), meta: { title: 'CMS Blogs', requiresAuth: true, adminLayout: true } },
      { path: 'cms-faqs', name: 'admin-cms-faqs', component: () => import('@/views/admin/AdminFaqs.vue'), meta: { title: 'CMS FAQs', requiresAuth: true, adminLayout: true } },
      { path: 'cms-menus', name: 'admin-cms-menus', component: () => import('@/views/admin/AdminMenus.vue'), meta: { title: 'CMS Menus', requiresAuth: true, adminLayout: true } },
      { path: 'reports', name: 'admin-reports', component: () => import('@/views/admin/AdminReports.vue'), meta: { title: 'Reports', requiresAuth: true, adminLayout: true } },
      { path: 'payment-settings', name: 'admin-payment-settings', component: () => import('@/views/admin/AdminPaymentSettings.vue'), meta: { title: 'Payment Settings', requiresAuth: true, adminLayout: true } },
      { path: 'email-settings', name: 'admin-email-settings', component: () => import('@/views/admin/AdminEmailSettings.vue'), meta: { title: 'Email Settings', requiresAuth: true, adminLayout: true } },
      { path: 'theme-settings', name: 'admin-theme-settings', component: () => import('@/views/admin/AdminThemeSettings.vue'), meta: { title: 'Theme Settings', requiresAuth: true, adminLayout: true } },
      { path: 'balance', name: 'admin-balance', component: () => import('@/views/admin/AdminBalanceManagement.vue'), meta: { title: 'Balance Management', requiresAuth: true, adminLayout: true } },
      { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/AdminOrders.vue'), meta: { title: 'Orders', requiresAuth: true, adminLayout: true } },
      { path: 'platform-wallet', name: 'admin-platform-wallet', component: () => import('@/views/admin/AdminPlatformWallet.vue'), meta: { title: 'Platform Wallet', requiresAuth: true, adminLayout: true } },
      { path: 'sessions-audit', name: 'admin-sessions-audit', component: () => import('@/views/admin/AdminSessionsAudit.vue'), meta: { title: 'Sessions & Audit', requiresAuth: true, adminLayout: true } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettings.vue'), meta: { title: 'Settings', requiresAuth: true, adminLayout: true } },
      { path: 'maintenance', name: 'admin-maintenance', component: () => import('@/views/admin/AdminMaintenance.vue'), meta: { title: 'Maintenance & Backup', requiresAuth: true, adminLayout: true } },
      { path: 'homepage-sections', name: 'admin-homepage-sections', component: () => import('@/views/admin/AdminHomepageSections.vue'), meta: { title: 'Homepage Sections', requiresAuth: true, adminLayout: true } },
      { path: 'submissions', name: 'admin-submissions', component: () => import('@/views/admin/AdminSubmissions.vue'), meta: { title: 'Inquiries', requiresAuth: true, adminLayout: true } },

      { path: 'livechat-inbox', name: 'admin-livechat-inbox', component: () => import('@/views/admin/AdminLiveChatInbox.vue'), meta: { title: 'Live Chat Inbox', requiresAuth: true, adminLayout: true } },
      { path: 'livechat-settings', name: 'admin-livechat-settings', component: () => import('@/views/admin/AdminLiveChatSettings.vue'), meta: { title: 'Live Chat Settings', requiresAuth: true, adminLayout: true } },
      { path: 'seller-id-settings', name: 'admin-seller-id-settings', component: () => import('@/views/admin/AdminSellerIdSettings.vue'), meta: { title: 'Seller ID Settings', requiresAuth: true, adminLayout: true } },
      { path: 'logistics', name: 'admin-logistics', component: () => import('@/views/admin/AdminLogistics.vue'), meta: { title: 'Logistics', requiresAuth: true, adminLayout: true } },
      { path: 'superadmin-dashboard', name: 'admin-superadmin-dashboard', component: () => import('@/views/admin/SuperAdminDashboard.vue'), meta: { title: 'Super Admin', requiresAuth: true, adminLayout: true } },
    ]
  },

  { path: '/refresh', name: 'refresh', component: () => import('@/views/other/Refresh.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/other/NotFound.vue'), meta: { title: '404' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const adminPathRules = [
  { pattern: /^\/admin-dashboard$/, redirect: '/admin/dashboard' },
  { pattern: /^\/admin-users$/, redirect: '/admin/users' },
  { pattern: /^\/admin-sellers$/, redirect: '/admin/sellers' },
  { pattern: /^\/admin-products$/, redirect: '/admin/products' },
  { pattern: /^\/admin-transactions$/, redirect: '/admin/transactions' },
  { pattern: /^\/admin-coupons$/, redirect: '/admin/coupons' },
  { pattern: /^\/admin-banners$/, redirect: '/admin/banners' },
  { pattern: /^\/admin-invitation-codes$/, redirect: '/admin/invitation-codes' },
  { pattern: /^\/admin-reviews$/, redirect: '/admin/reviews' },
  { pattern: /^\/admin-roles$/, redirect: '/admin/roles' },
  { pattern: /^\/admin-cms-pages$/, redirect: '/admin/cms-pages' },
  { pattern: /^\/admin-cms-blogs$/, redirect: '/admin/cms-blogs' },
  { pattern: /^\/admin-cms-faqs$/, redirect: '/admin/cms-faqs' },
  { pattern: /^\/admin-cms-menus$/, redirect: '/admin/cms-menus' },
  { pattern: /^\/admin-reports$/, redirect: '/admin/reports' },
  { pattern: /^\/admin-payment-settings$/, redirect: '/admin/payment-settings' },
  { pattern: /^\/admin-email-settings$/, redirect: '/admin/email-settings' },
  { pattern: /^\/admin-theme-settings$/, redirect: '/admin/theme-settings' },
  { pattern: /^\/admin-balance$/, redirect: '/admin/balance' },
  { pattern: /^\/admin-platform-wallet$/, redirect: '/admin/platform-wallet' },
  { pattern: /^\/admin-sessions-audit$/, redirect: '/admin/sessions-audit' },
  { pattern: /^\/admin-settings$/, redirect: '/admin/settings' },
  { pattern: /^\/admin-maintenance$/, redirect: '/admin/maintenance' },
  { pattern: /^\/admin-homepage-sections$/, redirect: '/admin/homepage-sections' },
  { pattern: /^\/admin-submissions$/, redirect: '/admin/submissions' },
  { pattern: /^\/admin-livechat-inbox$/, redirect: '/admin/livechat-inbox' },
  { pattern: /^\/admin-livechat-settings$/, redirect: '/admin/livechat-settings' },
  { pattern: /^\/admin-seller-id-settings$/, redirect: '/admin/seller-id-settings' },
  { pattern: /^\/admin-logistics$/, redirect: '/admin/logistics' },
  { pattern: /^\/superadmin-dashboard$/, redirect: '/admin/superadmin-dashboard' },
  { pattern: /^\/admin-orders$/, redirect: '/admin/orders' },
  { pattern: /^\/admin\/login$/, redirect: '/admin' },
  { pattern: /^\/admin-user-edit\/(.+)$/, redirect: (m) => `/admin/users/edit/${m[1]}` },
  { pattern: /^\/admin-user-privacy\/(.+)$/, redirect: (m) => `/admin/users/privacy/${m[1]}` },
  { pattern: /^\/admin-user-detail\/(.+)$/, redirect: (m) => `/admin/users/detail/${m[1]}` },
  { pattern: /^\/admin-shop-detail\/(.+)$/, redirect: (m) => `/admin/shop-detail/${m[1]}` },
]

const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return false
  }
}

router.beforeEach((to, from, next) => {
  const store = useAppStore()
  const adminStore = useAdminAppStore()

  if (to.query.temp_token) {
    localStorage.setItem('seller_temp_token', to.query.temp_token)
    store.setToken(to.query.temp_token)
    const { temp_token, ...rest } = to.query
    next({ path: to.path, query: rest })
    return
  }

  for (const rule of adminPathRules) {
    const match = to.path.match(rule.pattern)
    if (match) {
      const redirectPath = typeof rule.redirect === 'function' ? rule.redirect(match) : rule.redirect
      next(redirectPath)
      return
    }
  }

  window.scrollTo(0, 0)
  document.title = to.meta.title || 'Shopify Wholesale'

  if (to.name === 'login' && store.isLogin && store.userInfo?.username && !isTokenExpired(store.token)) {
    next('/main')
    return
  }
  if (to.name === 'admin-login' && adminStore.isLogin && adminStore.userInfo?.username && !isTokenExpired(adminStore.token)) {
    next('/admin/dashboard')
    return
  }

  if (to.path.startsWith('/admin') && to.name !== 'admin-login') {
    if (!adminStore.isLogin || isTokenExpired(adminStore.token)) {
      const mainStore = useAppStore()
      if (mainStore.isAdmin && !isTokenExpired(mainStore.token)) {
        adminStore.setToken(mainStore.token)
        adminStore.setRefreshToken(mainStore.refreshToken)
        adminStore.setUserInfo(mainStore.userInfo)
      } else {
        next({ name: 'admin-login' })
        return
      }
    }
  } else if (to.matched.some(r => r.meta.requiresAuth) && (!store.isLogin || isTokenExpired(store.token))) {
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
