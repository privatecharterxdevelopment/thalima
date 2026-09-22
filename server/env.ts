import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export function loadDotEnv() {
  try {
    const text = readFileSync(join(ROOT, '.env'), 'utf8')
    for (const line of text.split('\n')) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const i = line.indexOf('=')
      const key = line.slice(0, i).trim()
      const val = line.slice(i + 1).trim()
      if (key && process.env[key] == null) process.env[key] = val
    }
  } catch {
    /* no .env in this process */
  }
}

loadDotEnv()
