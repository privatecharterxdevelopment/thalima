import { build } from 'vite'

await build({
  configFile: false,
  logLevel: 'warn',
  publicDir: false,
  build: {
    ssr: 'server/notifyHandler.ts',
    outDir: 'api',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'notify.js',
      },
    },
  },
})
