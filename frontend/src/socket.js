import { io } from 'socket.io-client'
import { API_BASE } from '@/api/request'

let socket = null

export const connectSocket = () => {
  if (socket?.connected) return socket
  try {
    socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
    socket.on('connect', () => console.log('Socket connected'))
    socket.on('disconnect', () => console.log('Socket disconnected'))
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message))
  } catch (e) {
    console.warn('Socket init failed:', e.message)
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export const joinUser = (userId) => {
  if (socket?.connected && userId) {
    socket.emit('join', { userId })
  }
}

export const markRead = (data) => {
  if (socket?.connected) {
    socket.emit('markRead', data)
  }
}