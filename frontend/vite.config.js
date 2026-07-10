import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.js',
      injectManifest: { injectionPoint: 'self.__WB_MANIFEST' },
      includeAssets: ['font/*.ttf', 'font/*.woff', 'font/*.woff2', 'font/*.png', 'img/*.svg', 'img/*.png'],
      manifest: {
        name: 'THE OUTNET WHOLESALE',
        short_name: 'THE OUTNET',
        description: 'Wholesale luxury fashion marketplace — premium designer brands at wholesale prices',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        orientation: 'portrait-primary',
        categories: ['shopping', 'fashion', 'lifestyle'],
        screenshots: [
          { src: '/screenshots/home.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
        ],
        icons: [
          { src: '/img/outnet-logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/img/outnet-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/img/outnet-logo.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/img/outnet-logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ttf,woff,woff2,png,svg,ico}'],
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
