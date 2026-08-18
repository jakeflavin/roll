import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path of the portfolio's Hosting site.
  base: '/hat/',
  plugins: [react()],
})
