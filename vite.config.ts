import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const MST = 'https://www.myshiptracking.com/vessels/thalima-mmsi-235077622-imo-9590278'

function aisFeed(): Plugin {
  return {
    name: 'thalima-ais',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/ais') return next()
        try {
          const r = await fetch(MST, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ThalimaCrew/1.0)',
              Accept: 'text/html,application/xhtml+xml',
            },
          })
          const html = await r.text()
          res.statusCode = r.ok ? 200 : 502
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(html)
        } catch {
          res.statusCode = 502
          res.end('')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), aisFeed()],
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
})
