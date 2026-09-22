import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleAis } from './server/ais'
import { handleApi } from './server/api'

function aisFeed(): Plugin {
  return {
    name: 'thalima-ais',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/ais') return next()
        void handleAis(req, res)
      })
    },
  }
}

function thalimaApi(): Plugin {
  const mount = (server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) => {
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split('?')[0] ?? ''
      if (!path.startsWith('/api/') || path === '/api/ais') return next()
      void handleApi(req, res)
    })
  }
  return {
    name: 'thalima-api',
    configureServer: mount,
    configurePreviewServer: mount,
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] == null) process.env[key] = value
  }
  return {
  plugins: [react(), aisFeed(), thalimaApi()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  optimizeDeps: {
    include: ['mapbox-gl', '@supabase/supabase-js'],
  },
  }
})
