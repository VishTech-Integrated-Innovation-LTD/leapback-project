import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Recharts uses CommonJS internally — Vite needs to pre-bundle it
    include: ['recharts', 'recharts/es6/component/DefaultTooltipContent'],
  },
})


