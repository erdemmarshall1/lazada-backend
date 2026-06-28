import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['font/*.ttf', 'font/*.woff', 'font/*.woff2', 'font/*.png', 'img/*.svg', 'img/*.png'],
      manifest: {
        name: 'Shopify Wholesale',
        short_name: 'Shopify WS',
        description: 'Wholesale e-commerce platform powered by Shopify',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        orientation: 'portrait-primary',
        icons: [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ttf,woff,woff2,png,svg,ico}'],
        navigateFallback: '/',
        navigateFallbackAllowlist: [/^\/$/],
        navigateFallbackDenylist: [/\/main\//, /\/home\//, /\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/main\/|\/home\/|\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'shopify-wholesale-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'shopify-wholesale-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/main': { target: 'http://localhost:3000', changeOrigin: true },
      '/home': { target: 'http://localhost:3000', changeOrigin: true },
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
})
