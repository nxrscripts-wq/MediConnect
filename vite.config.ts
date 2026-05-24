import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa'

// lovable-tagger only used locally — never imported in production build
// Using dynamic require so it doesn't crash Vercel when not installed
function loadTagger(): Plugin | false {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { componentTagger } = require("lovable-tagger");
    return componentTagger() as Plugin;
  } catch {
    return false;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && loadTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MediConnect — Sistema Nacional de Saúde',
        short_name: 'MediConnect',
        description: 'Sistema de Gestão de Saúde Pública — República de Angola',
        theme_color: '#0A5C75',
        background_color: '#F3F4F6',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        categories: ['health', 'medical', 'government'],
        shortcuts: [
          { name: 'Dashboard', url: '/', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
          { name: 'Pacientes', url: '/pacientes', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
          { name: 'Agendamento', url: '/agendamento', icons: [{ src: '/favicon.svg', sizes: 'any' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    })
  ].filter(Boolean) as Plugin[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['html2canvas'],
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':    ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui':       [
            '@radix-ui/react-dialog', '@radix-ui/react-select',
            '@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-alert-dialog', '@radix-ui/react-popover',
            '@radix-ui/react-switch'
          ],
          'vendor-charts':   ['recharts'],
          'vendor-pdf':      ['jspdf', 'jspdf-autotable'],
          'vendor-xlsx':     ['xlsx'],
          'vendor-forms':    ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
}));
