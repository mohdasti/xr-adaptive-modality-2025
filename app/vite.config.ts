import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for deployment (leave empty for root, or set to repo name for GitHub Pages)
  // base: '/xr-adaptive-modality-2025/',
})
