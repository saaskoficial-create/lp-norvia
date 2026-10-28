import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Server } from 'node:http'
import handler, { createVercelApp } from '../api/index.ts'

const lead = () => ({
  requestId: randomUUID(), name: 'Teste Adaptador', company: 'Transportadora de Teste',
  role: 'Gestor de TI', email: 'adapter@example.com', whatsapp: '(11) 90000-0000',
  consent: true, website: '', landingPath: '/', attribution: { utm_source: 'test' },
})

async function withAdapter(app: ReturnType<typeof createVercelApp>, execute: (url: string) => Promise<void>) {
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try { await execute(`http://127.0.0.1:${address.port}`) }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

const post = (url: string, data: unknown, forwardedFor = '203.0.113.1') => fetch(`${url}/api/leads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: url, 'X-Forwarded-For': forwardedFor },
  body: JSON.stringify(data),
})

test('default export is the reusable Express handler without a port listener', async () => {
  assert.equal(typeof handler, 'function')
  await withAdapter(handler, async url => {
    const response = await fetch(`${url}/api/leads/status`)
    assert.equal(response.status, 200)
    assert.equal(typeof (await response.json()).available, 'boolean')
    assert.equal(response.headers.get('cache-control'), 'no-store')
  })
})

test('Vercel adapter keeps status and unknown API paths separate from the static SPA', async () => {
  await withAdapter(createVercelApp({}), async url => {
    const status = await fetch(`${url}/api/leads/status?source=adapter-test`)
    assert.deepEqual(await status.json(), { available: false })
    const unknown = await fetch(`${url}/api/does-not-exist`)
    assert.equal(unknown.status, 404)
    assert.match(unknown.headers.get('content-type') || '', /application\/json/)
  })
})

test('trust proxy is scoped to the verified Vercel environment flag', () => {
  assert.equal(createVercelApp({}).get('trust proxy'), false)
  assert.equal(createVercelApp({ VERCEL: '0' }).get('trust proxy'), false)
  assert.equal(createVercelApp({ VERCEL: '1' }).get('trust proxy'), 1)
})

test('different forwarded client IPs get separate buckets; left-side spoofing cannot reset the nearest-hop bucket', async () => {
  let calls = 0
  const app = createVercelApp({ VERCEL: '1' }, {
    available: true, rateLimitMax: 1,
    transport: async body => { calls += 1; return { requestId: body.requestId, stored: true } },
  })
  await withAdapter(app, async url => {
    assert.equal((await post(url, lead(), '198.51.100.10, 203.0.113.1')).status, 200)
    assert.equal((await post(url, lead(), '198.51.100.99, 203.0.113.1')).status, 429)
    assert.equal((await post(url, lead(), '203.0.113.2')).status, 200)
    assert.equal(calls, 2)
  })
})

test('serverless adapter retains production origin checks and body size/JSON validation', async () => {
  let calls = 0
  const app = createVercelApp({ VERCEL: '1' }, {
    available: true, rateLimitMax: 20,
    transport: async body => { calls += 1; return { requestId: body.requestId, stored: true } },
  })
  await withAdapter(app, async url => {
    const crossOrigin = await fetch(`${url}/api/leads`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example.com' }, body: JSON.stringify(lead()),
    })
    assert.equal(crossOrigin.status, 400)
    assert.equal((await post(url, { ...lead(), name: 'x'.repeat(9000) })).status, 413)
    const malformed = await fetch(`${url}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' })
    assert.equal(malformed.status, 400)
    const valid = lead()
    assert.deepEqual(await (await post(url, valid)).json(), { ok: true, stored: true, requestId: valid.requestId })
    assert.equal(calls, 1)
  })
})
