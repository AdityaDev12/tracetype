import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { lessonMetaPlugin } from './scripts/vite/lessonMeta.ts'

export default defineConfig({
  base: '/tracetype/',
  plugins: [lessonMetaPlugin(), react()],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
