import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'CoreSpec Hardware Store',
        short_name: 'CoreSpec',
        description: 'Precision PC components, laptops, and monitors with offline catalog browsing.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#090d16',
        background_color: '#f4f6fa',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method !== 'GET' ||
              url.pathname.startsWith('/api/v1/auth') ||
              url.pathname.startsWith('/api/v1/checkout') ||
              url.pathname.startsWith('/api/v1/cart') ||
              url.pathname.startsWith('/api/v1/orders') ||
              url.pathname.startsWith('/api/v1/webhooks') ||
              url.pathname.startsWith('/api/v1/upload') ||
              url.pathname.startsWith('/api/v1/ai'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/v1/products'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'corespec-products-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'corespec-images-cache',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
});