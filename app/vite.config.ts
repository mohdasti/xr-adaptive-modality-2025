import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for deployment (leave empty for root, or set to repo name for GitHub Pages)
  // base: '/xr-adaptive-modality-2025/',
  define: {
    // Inject build SHA from environment variable or git
    __APP_BUILD_SHA__: JSON.stringify(
      process.env.VITE_APP_BUILD_SHA || 
      process.env.GIT_SHA || 
      'dev'
    ),
    __CONDITION_VERSION__: JSON.stringify('1.0'),
  },
})
