import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.svg', '**/*.webp'],
  build: {
    assetsInlineLimit: 0, // Don't inline any assets
  },
  server: {
    fs: {
      // Allow serving files from assets
      allow: ['..']
    }
  }
})
