import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { createKestraTransport, isValidKestraWebhook } from './kestra.ts'
import type { LeadRequest } from '../shared/lead-schema.ts'

const exampleLead = (): LeadRequest => ({
  requestId: randomUUID(), name: 'Teste Integração', company: 'Transportadora de Teste',
  role: 'Gestor de TI', email: 'teste@example.com', whatsapp: '+5511999999999',
  consent: true, website: '', landingPath: '/', attribution: { utm_source: 'test' },
})

async function withDestination(
  respond: (lead: LeadRequest, request: IncomingMessage) => { status?: number; body: unknown; delayMs?: number },
  execute: (url: string) => Promise<void>,
) {
  const server = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk.toString()
    const result = respond(JSON.parse(body), request)
    if (result.delayMs) await new Promise((resolve) => setTimeout(resolve, result.delayMs))
    response.writeHead(result.status || 200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(result.body))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try { await execute(`http://127.0.0.1:${address.port}/webhook`) }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('only HTTPS or loopback HTTP webhook configuration is allowed', () => {
  for (const url of ['https://kestra.example.com/webhook/secret', 'http://localhost:9876/webhook', 'http://127.0.0.1:9876/webhook']) assert.ok(isValidKestraWebhook(url))
  for (const url of ['', 'not-a-url', 'http://kestra.example.com/webhook', 'ftp://localhost/webhook', 'https://user:password@kestra.example.com/webhook', 'https://kestra.example.com/webhook#fragment']) assert.ok(!isValidKestraWebhook(url))
})

test('Kestra transport waits synchronously and accepts only confirmed Sheets storage for this ID', async () => {
  let received: LeadRequest | undefined
  await withDestination((lead, request) => {
    received = lead
    const url = new URL(request.url!, 'http://localhost')
    assert.equal(url.searchParams.get('wait'), 'true')
    assert.equal(url.searchParams.get('returnOutputs'), 'true')
    assert.equal(request.headers.authorization, 'Bearer test-only')
    return { body: { ok: true, stored: true, requestId: lead.requestId, spreadsheetId: 'sheet-test-only' } }
  }, async (webhookUrl) => {
    const lead = exampleLead()
    const transport = createKestraTransport({ webhookUrl, authorization: 'Bearer test-only' })
    assert.deepEqual(await transport(lead), { requestId: lead.requestId, stored: true })
    assert.deepEqual(received, lead)
  })
})

test('HTTP 200 with CREATED/RUNNING, missing storage, mismatched request ID or wrapped outputs fails', async () => {
  for (const getBody of [
    () => ({ id: 'execution-id', state: { current: 'CREATED' } }),
    () => ({ id: 'execution-id', state: { current: 'RUNNING' } }),
    (lead: LeadRequest) => ({ ok: true, requestId: lead.requestId, spreadsheetId: 'sheet-test-only' }),
    (lead: LeadRequest) => ({ ok: true, stored: false, requestId: lead.requestId, spreadsheetId: 'sheet-test-only' }),
    () => ({ ok: true, stored: true, requestId: randomUUID(), spreadsheetId: 'sheet-test-only' }),
    (lead: LeadRequest) => ({ ok: true, stored: true, requestId: lead.requestId }),
    (lead: LeadRequest) => ({ outputs: { ok: true, stored: true, requestId: lead.requestId, spreadsheetId: 'sheet-test-only' } }),
  ]) {
    await withDestination((lead) => ({ body: getBody(lead) }), async (webhookUrl) => {
      await assert.rejects(createKestraTransport({ webhookUrl })(exampleLead()), /Storage not confirmed/)
    })
  }
})

test('destination HTTP error and transport timeout do not report success', async () => {
  await withDestination(() => ({ status: 500, body: { ok: false } }), async (webhookUrl) => {
    await assert.rejects(createKestraTransport({ webhookUrl })(exampleLead()), /Destination rejected/)
  })
  await withDestination((lead) => ({ delayMs: 100, body: { ok: true, stored: true, requestId: lead.requestId, spreadsheetId: 'sheet-test-only' } }), async (webhookUrl) => {
    await assert.rejects(createKestraTransport({ webhookUrl, timeoutMs: 10 })(exampleLead()), { name: 'TimeoutError' })
  })
})
