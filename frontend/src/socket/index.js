import { io } from 'socket.io-client'
import { useAppStore } from '@/stores/app'
import { ElNotification } from 'element-plus'
import router from '@/router'

let socket = null

const notifyOrder = (title, message, type = 'success', link = '') => {
  ElNotification({ title, message, type, duration: 5000, onClick: () => { if (link) router.push(link) } })
}

export const connectSocket = () => {
  if (socket?.connected) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    const store = useAppStore()
    if (store.token && store.userInfo?._id) {
      socket.emit('join', {
        userId: store.userInfo._id,
        shopId: store.userInfo?.shopId || null,
      })
    }
  })

  socket.on('newMessage', (msg) => {
    const store = useAppStore()
    if (!store.token) return

    const isFromShop = !!msg.shopId
    if (isFromShop) {
      store.userUnreadMsgNum++
    } else {
      store.storeUnReadMsgNum++
    }

    store.addAudio('/audio/notification.mp3')
  })

  socket.on('messagesRead', (data) => {
    const store = useAppStore()
    store.userUnreadMsgNum = 0
    store.storeUnReadMsgNum = 0
  })

  socket.on('newOrder', (data) => {
    const store = useAppStore()
    if (store.isSeller || store.isAdmin) {
      store.incrementNewOrderCount()
      notifyOrder('New Order', data.message || 'A new order has been placed', 'success', '/storeordercontrol')
      store.addAudio('/audio/notification.mp3')
    }
  })

  socket.on('orderPaid', (data) => {
    const store = useAppStore()
    if (store.isSeller) {
      notifyOrder('Order Paid', data.message || 'An order has been paid', 'success', '/storeordercontrol')
    }
  })

  socket.on('orderShipped', (data) => {
    const store = useAppStore()
    if (store.isLogin) {
      notifyOrder('Order Shipped', data.message || 'Your order has been shipped', 'info', '/myorder')
      store.addAudio('/audio/notification.mp3')
    }
  })

  socket.on('orderCancelled', (data) => {
    const store = useAppStore()
    if (store.isSeller) {
      notifyOrder('Order Cancelled', data.message || 'An order was cancelled', 'warning', '/storeordercontrol')
    }
  })

  socket.on('orderCompleted', (data) => {
    const store = useAppStore()
    if (store.isSeller) {
      notifyOrder('Order Completed', data.message || 'An order has been completed', 'success', '/storeordercontrol')
    }
  })

  socket.on('refundRequested', (data) => {
    const store = useAppStore()
    if (store.isSeller || store.isAdmin) {
      store.incrementRefundRequestCount()
      notifyOrder('Refund Requested', data.message || 'A refund has been requested', 'warning', '/storeordercontrol')
      store.addAudio('/audio/notification.mp3')
    }
  })

  socket.on('refundProcessed', (data) => {
    const store = useAppStore()
    if (store.isLogin) {
      notifyOrder('Refund Update', data.message || 'Your refund has been processed', 'info', '/myorder')
    }
  })

  socket.on('walletUpdated', (data) => {
    const store = useAppStore()
    if (store.token) {
      store.setWalletBalance(data.balance)
    }
  })

  socket.on('disconnect', () => {
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export const sendSocketMessage = (data) => {
  if (socket?.connected) {
    socket.emit('sendMessage', data)
  }
}

export const markRead = (data) => {
  if (socket?.connected) {
    socket.emit('markRead', data)
  }
}
