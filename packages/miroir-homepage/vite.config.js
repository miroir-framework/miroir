import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: __dirname,
  // VITE_BASE_URL sets the URL prefix (default '/miroir/') in both dev and build.
  // PORT sets the dev server port (default 5173).
  base: process.env.VITE_BASE_URL ?? '/miroir/',
  server: {
    port: parseInt(process.env.PORT ?? '5173'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        blog: path.resolve(__dirname, 'blog/index.html'),
        whyMiroir: path.resolve(__dirname, 'blog/why-miroir/index.html'),
      },
    },
  },
})
