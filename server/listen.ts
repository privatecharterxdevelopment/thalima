import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import './env'
import { handleAis } from './ais'
import { handleApi } from './api'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 5173)
const HOST = process.env.HOST || '0.0.0.0'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
}

function sendFile(res: import('node:http').ServerResponse, file: string) {
  const ext = extname(file).toLowerCase()
  res.statusCode = 200
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  createReadStream(file).pipe(res)
}

createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0] || '/')
  if (path === '/api/ais') {
    void handleAis(req, res)
    return
  }
  if (path.startsWith('/api/')) {
    void handleApi(req, res)
    return
  }
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '')
  const file = join(DIST, safe)
  if (safe !== '/' && existsSync(file) && statSync(file).isFile()) {
    sendFile(res, file)
    return
  }
  const index = join(DIST, 'index.html')
  if (existsSync(index)) {
    sendFile(res, index)
    return
  }
  res.statusCode = 404
  res.end('Build first: npm run build && npm start')
}).listen(PORT, HOST, () => {
  console.log(`Thalima CRM  http://${HOST}:${PORT}`)
})
