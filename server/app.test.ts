import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Server } from 'node:http'
import { createLeadApp } from './app.ts'
import type { LeadTransport } from './app.ts'
import type { LeadRequest } from '../shared/lead-schema.ts'

const exampleLead = (): LeadRequest => ({
  requestId: randomUUID(), name: 'Teste Integração', company: 'Transportadora de Teste',
  role: 'Gestor de TI', email: 'teste@example.com', whatsapp: '(11) 99999-9999',
  consent: true, website: '', landingPath: '/', attribution: { utm_source: 'test' },
})
const confirmed: LeadTransport = async (lead) => ({ requestId: lead.requestId, stored: true })
const configured = { available: true, rateLimitMax: 100 }

async function withApp(options: Parameters<typeof createLeadApp>[0], execute: (url: string) => Promise<void>) {
  const app = createLeadApp(options)
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try { await execute(`http://127.0.0.1:${address.port}`) }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}
const post = (url: string, data: unknown) => fetch(`${url}/api/leads`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
})

test('missing configuration is unavailable and never simulates successful storage', async () => {
  let sends = 0
  await withApp({ transport: async (lead) => { sends += 1; return confirmed(lead) } }, async (url) => {
    assert.deepEqual(await (await fetch(`${url}/api/leads/status`)).json(), { available: false })
    assert.equal((await post(url, exampleLead())).status, 503)
    assert.equal(sends, 0)
  })
})

test('invalid input and honeypot are rejected before contacting the destination', async () => {
  let sends = 0
  await withApp({ ...configured, transport: async (lead) => { sends += 1; return confirmed(lead) } }, async (url) => {
    for (const data of [
      { ...exampleLead(), email: 'invalid' }, { ...exampleLead(), consent: false },
      { ...exampleLead(), whatsapp: '123' }, { ...exampleLead(), role: 'invalid' },
      { ...exampleLead(), website: 'spam' }, { ...exampleLead(), webhookUrl: 'https://other.example.com' },
    ]) assert.equal((await post(url, data)).status, 400)
    assert.equal(sends, 0)
  })
})

test('success requires confirmed storage of this exact request and forwards normalized lead data', async () => {
  let delivered: LeadRequest | undefined
  await withApp({ ...configured, transport: async (lead) => { delivered = lead; return confirmed(lead) } }, async (url) => {
    const lead = exampleLead()
    const response = await post(url, lead)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true, stored: true, requestId: lead.requestId })
    assert.equal(delivered?.whatsapp, '+5511999999999')
    assert.equal(delivered?.requestId, lead.requestId)
    assert.equal(delivered?.email, 'teste@example.com')
  })
})

test('a generic transport result or mismatched ID is never accepted as stored', async () => {
  for (const result of [{ id: 'execution', state: 'CREATED' }, { stored: false }, { stored: true, requestId: randomUUID() }]) {
    const transport = (async () => result) as unknown as LeadTransport
    await withApp({ ...configured, transport }, async (url) => {
      assert.equal((await post(url, exampleLead())).status, 502)
    })
  }
})

test('concurrent submits and retry with the same request ID result in one destination call', async () => {
  let sends = 0
  const transport: LeadTransport = async (lead) => {
    sends += 1
    await new Promise((resolve) => setTimeout(resolve, 25))
    return confirmed(lead)
  }
  await withApp({ ...configured, transport }, async (url) => {
    const lead = exampleLead()
    assert.ok((await Promise.all([post(url, lead), post(url, lead)])).every((response) => response.status === 200))
    assert.equal((await post(url, lead)).status, 200)
    assert.equal((await post(url, { ...lead, company: 'Outra empresa' })).status, 400)
    assert.equal(sends, 1)
  })
})

test('destination failure returns a sanitized error and permits a manual retry', async () => {
  let sends = 0
  await withApp({ ...configured, transport: async (lead) => {
    sends += 1
    if (sends === 1) throw new Error('private webhook URL and details')
    return confirmed(lead)
  } }, async (url) => {
    const lead = exampleLead()
    const response = await post(url, lead)
    assert.equal(response.status, 502)
    assert.ok(!(await response.text()).includes('private webhook'))
    assert.equal((await post(url, lead)).status, 200)
    assert.equal(sends, 2)
  })
})

test('ambiguous timeout keeps the pending request and manual retry does not duplicate it', async () => {
  let sends = 0
  let finish: (() => void) | undefined
  await withApp({ ...configured, timeoutMs: 15, transport: async (lead) => {
    sends += 1
    await new Promise<void>((resolve) => { finish = resolve })
    return confirmed(lead)
  } }, async (url) => {
    const lead = exampleLead()
    assert.equal((await post(url, lead)).status, 504)
    assert.equal((await post(url, lead)).status, 504)
    assert.equal(sends, 1)
    finish!()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal((await post(url, lead)).status, 200)
    assert.equal(sends, 1)
  })
})

test('oversized bodies, malformed JSON, and unsupported methods are rejected', async () => {
  await withApp({}, async (url) => {
    assert.equal((await post(url, { ...exampleLead(), name: 'x'.repeat(9000) })).status, 413)
    const unsupported = await fetch(`${url}/api/leads`)
    assert.equal(unsupported.status, 405)
    assert.equal(unsupported.headers.get('allow'), 'POST')
    const malformed = await fetch(`${url}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' })
    assert.equal(malformed.status, 400)
  })
})

test('single-server rate limiting prevents repeated submissions', async () => {
  await withApp({ ...configured, rateLimitMax: 1, transport: confirmed }, async (url) => {
    assert.equal((await post(url, exampleLead())).status, 200)
    assert.equal((await post(url, exampleLead())).status, 429)
  })
})

test('production rejects cross-origin requests', async () => {
  await withApp({ ...configured, production: true, transport: confirmed }, async (url) => {
    const response = await fetch(`${url}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example.com' }, body: JSON.stringify(exampleLead()) })
    assert.equal(response.status, 400)
  })
})
