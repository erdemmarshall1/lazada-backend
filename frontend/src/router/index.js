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
      { path: 'gooddetail', name: 'gooddetail', component: () => import('@/views/product/GoodDetail.vue'), meta: { title: 'Product Detail' } },
      { path: 'car', name: 'car', component: () => import('@/views/cart/Car.vue'), meta: { title: 'Cart' } },
      { path: 'tuijianlist', name: 'tuijianlist', component: () => import('@/views/product/TuiJianList.vue'), meta: { title: 'Recommended' } },
      { path: 'remenglist', name: 'remenglist', component: () => import('@/views/product/ReMengList.vue'), meta: { title: 'Hot Products' } },
      { path: 'shopjie', name: 'shopjie', component: () => import('@/views/store/ShopJie.vue'), meta: { title: 'Shop Street' } },
      { path: 'searchgoods', name: 'searchgoods', component: () => import('@/views/search/SearchGoods.vue'), meta: { title: 'Search' } },
      { path: 'searchstore', name: 'searchstore', component: () => import('@/views/search/SearchStore.vue'), meta: { title: 'Search Stores' } },
      { path: 'secondsort', name: 'secondsort', component: () => import('@/views/product/SecondSort.vue'), meta: { title: 'Category' } },
      { path: 'storedetail', name: 'storedetail', component: () => import('@/views/store/StoreDetail.vue'), meta: { title: 'Store' } },
      { path: 'createorder', name: 'createorder', component: () => import('@/views/order/CreateOrder.vue'), meta: { title: 'Create Order' } },
      { path: 'createcarorder', name: 'createcarorder', component: () => import('@/views/order/CreateCarOrder.vue'), meta: { title: 'Checkout' } },
      { path: 'paywait', name: 'paywait', component: () => import('@/views/order/PayWait.vue'), meta: { title: 'Payment' } },
      { path: 'sourcegoodsdetail', name: 'sourcegoodsdetail', component: () => import('@/views/wholesale/SourceGoodsDetail.vue'), meta: { title: 'Wholesale' } },
      { path: 'rule', name: 'rule', component: () => import('@/views/other/Rule.vue'), meta: { title: 'Terms' } },
      { path: 'miaoshalist', name: 'miaoshalist', component: () => import('@/views/product/MiaoShaList.vue'), meta: { title: 'Flash Sale' } },
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
          { path: '/rechargehistory', name: 'rechargehistory', component: () => import('@/views/user/RechargeHistory.vue'), meta: { title: 'Recharge', requiresAuth: true } },
          { path: '/cashouthistory', name: 'cashouthistory', component: () => import('@/views/user/CashoutHistory.vue'), meta: { title: 'Withdrawals', requiresAuth: true } },
          { path: '/applystore', name: 'applystore', component: () => import('@/views/store/ApplyStore.vue'), meta: { title: 'Apply Store', requiresAuth: true } },
          { path: '/applyconfirm', name: 'applyconfirm', component: () => import('@/views/store/ApplyConfirm.vue'), meta: { title: 'Application Status', requiresAuth: true } },
          { path: '/myfollowshop', name: 'myfollowshop', component: () => import('@/views/store/MyFollowShop.vue'), meta: { title: 'Followed Stores', requiresAuth: true } },
          { path: '/seehistory', name: 'seehistory', component: () => import('@/views/user/SeeHistory.vue'), meta: { title: 'History', requiresAuth: true } },
          { path: '/mywishlist', name: 'mywishlist', component: () => import('@/views/user/MyWishlist.vue'), meta: { title: 'Wishlist', requiresAuth: true } },
          { path: '/sourcegoods', name: 'sourcegoods', component: () => import('@/views/wholesale/SourceGoods.vue'), meta: { title: 'Wholesale', requiresAuth: true } },
          { path: '/ordertracking', name: 'ordertracking', component: () => import('@/views/logistics/OrderTracking.vue'), meta: { title: 'Order Tracking', requiresAuth: true } },
          { path: '/storegoodcontrol', name: 'storegoodcontrol', component: () => import('@/views/store/StoreGoodControl.vue'), meta: { title: 'Products', requiresAuth: true } },
          { path: '/storeordercontrol', name: 'storeordercontrol', component: () => import('@/views/store/StoreOrderControl.vue'), meta: { title: 'Orders', requiresAuth: true } },
          { path: '/sellerlogistics', name: 'sellerlogistics', component: () => import('@/views/logistics/SellerLogistics.vue'), meta: { title: 'Logistics', requiresAuth: true } },
          { path: '/chattostorelist', name: 'chattostorelist', component: () => import('@/views/chat/ChatToStoreList.vue'), meta: { title: 'Messages', requiresAuth: true } },
          { path: '/chattostore', name: 'chattostore', component: () => import('@/views/chat/ChatToStore.vue'), meta: { title: 'Chat', requiresAuth: true } },
          { path: '/chattouserlist', name: 'chattouserlist', component: () => import('@/views/chat/ChatToUserList.vue'), meta: { title: 'Customer Messages', requiresAuth: true } },
          { path: '/chattouser', name: 'chattouser', component: () => import('@/views/chat/ChatToUser.vue'), meta: { title: 'Chat', requiresAuth: true } },
          { path: '/mystore', name: 'mystore', component: () => import('@/views/store/MyStore.vue'), meta: { title: 'My Store', requiresAuth: true } },
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
        ],
      },
    ],
  },
  { path: '/refresh', name: 'refresh', component: () => import('@/views/other/Refresh.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/other/NotFound.vue'), meta: { title: '404' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const store = useAppStore()

  window.scrollTo(0, 0)
  document.title = to.meta.title || 'Shopify Wholesale'

  if (to.name === 'login' && store.isLogin) {
    next('/main')
    return
  }

  if (to.matched.some(r => r.meta.requiresAuth) && !store.isLogin) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
