import swc from 'unplugin-swc'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup-db.ts'],
    // one database, so files must not run their truncations concurrently
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [swc.vite()],
})
