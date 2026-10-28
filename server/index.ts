import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'node:url'
import { createLeadApp } from './app.ts'

const production = process.env.NODE_ENV === 'production'
const app = createLeadApp({
  webhookUrl: process.env.KESTRA_LEAD_WEBHOOK_URL,
  authorization: process.env.KESTRA_AUTHORIZATION,
  production,
})

if (production) {
  const dist = fileURLToPath(new URL('../dist', import.meta.url))
  app.use(express.static(dist, { index: false }))
  app.get('/{*path}', (_request, response) => response.sendFile(`${dist}/index.html`))
}

const port = Number(process.env.PORT || 8787)
const host = production ? '0.0.0.0' : '127.0.0.1'
app.listen(port, host, () => {
  console.log(`Norvia server ready at http://${host}:${port}`)
})
