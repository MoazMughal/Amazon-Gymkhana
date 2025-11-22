import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to replace localhost URLs in production
const replaceLocalhostPlugin = () => ({
  name: 'replace-localhost',
  transform(code, id) {
    if (process.env.NODE_ENV === 'production' && (id.endsWith('.js') || id.endsWith('.jsx'))) {
      return code.replace(/http:\/\/localhost:5000/g, 'https://generic-wholesale-backend.onrender.com')
    }
    return code
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), replaceLocalhostPlugin()],
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.svg', '**/*.webp'],
  build: {
    assetsInlineLimit: 4096, // Inline small assets (4kb)
    // Optimize build
    minify: 'esbuild', // Use esbuild (faster and built-in)
    // Remove console.logs in production
    esbuild: {
      drop: ['console', 'debugger']
    },
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    fs: {
      // Allow serving files from assets
      allow: ['..']
    }
  }
})
