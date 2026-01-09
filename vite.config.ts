import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Base path pour GitHub Pages (remplacer 'chroma_control' par le nom de votre repo si différent)
const base = process.env.NODE_ENV === 'production' ? '/chroma_control/' : '/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Chroma Control',
        short_name: 'Chroma',
        description: 'Minimalist territorial conquest game',
        theme_color: '#121214',
        background_color: '#121214',
        display: 'standalone', // 'standalone' pour masquer la barre d'adresse (meilleur que 'fullscreen')
        orientation: 'portrait',
        start_url: '/chroma_control/',
        scope: '/chroma_control/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Optimisation des chunks
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Compression et optimisation
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true
  }
});
