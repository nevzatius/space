import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // satellite.js's WASM worker build uses top-level await, which the default
  // 'iife' worker output format can't represent — 'es' workers support it.
  worker: {
    format: 'es',
  },
})
