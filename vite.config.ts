import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const accquaConfettiProxy = fileURLToPath(new URL('./scr/lib/accquaConfettiProxy.js', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^canvas-confetti$/, replacement: accquaConfettiProxy },
    ],
  },
})
