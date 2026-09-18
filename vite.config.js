import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { learningContent } from './tests/fixtures/learningContent.js'

function mockLearningApi() {
  return {
    name: 'myhoa-test-learning-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0]
        if (request.method !== 'GET' || path !== '/api/learning') {
          next()
          return
        }

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(learningContent))
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [vue(), ...(mode === 'test' ? [mockLearningApi()] : [])],
  server: mode === 'test'
    ? undefined
    : {
        proxy: {
          '/api': {
            target: 'http://localhost:5262',
            changeOrigin: true,
          },
        },
      },
}))
