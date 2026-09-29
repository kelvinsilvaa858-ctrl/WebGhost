import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`         → build normal (assets separados, ideal para deploy)
// `npm run build:single`  → um único index.html autocontido (preview / artifact)
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    outDir: mode === 'single' ? 'dist-single' : 'dist',
  },
}))
