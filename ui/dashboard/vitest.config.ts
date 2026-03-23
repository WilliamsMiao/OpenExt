import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
