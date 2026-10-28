import { createHash } from 'node:crypto'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { leadRequestSchema, normalizeBrazilianPhone } from '../shared/lead-schema.ts'
import { createKestraTransport, isValidKestraWebhook } from './kestra.ts'
import type { LeadTransport } from './kestra.ts'
export type { LeadTransport } from './kestra.ts'

interface LeadAppOptions {
  webhookUrl?: string
  authorization?: string
  transport?: LeadTransport
  available?: boolean
  timeoutMs?: number
  rateLimitMax?: number
  production?: boolean
}

export function createLeadApp(options: LeadAppOptions = {}) {
  const app = express()
  app.disable('x-powered-by')
  const configured = isValidKestraWebhook(options.webhookUrl || '')
    && !/[\r\n]/.test(options.authorization || '')
  // Explicit injection is for isolated tests, never a client-controlled setting.
  const available = options.transport ? options.available === true : configured
  const transport = options.transport || (available ? createKestraTransport({
    webhookUrl: options.webhookUrl!, authorization: options.authorization, timeoutMs: options.timeoutMs,
  }) : undefined)
  const ttl = 24 * 60 * 60 * 1000
  // Single-process cache stores hashes and outcome only, never lead content.
  const delivered = new Map<string, { hash: string; at: number }>()
  const pending = new Map<string, { hash: string; promise: Promise<void>; at: number }>()
  const cleanCache = () => {
    const oldest = Date.now() - ttl
    for (const [key, item] of delivered) if (item.at < oldest) delivered.delete(key)
    for (const [key, item] of pending) if (item.at < oldest) pending.delete(key)
  }

  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store')
    next()
  })
  app.get('/api/leads/status', (_request, response) => {
    response.json({ available })
  })
  app.use('/api/leads', express.json({ limit: '8kb', strict: true }))
  app.post('/api/leads', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.rateLimitMax || 6,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde alguns minutos para tentar novamente.' },
  }), async (request, response) => {
    if (!request.is('application/json')) {
      response.status(400).json({ error: 'Formato de solicitação inválido.' })
      return
    }
    if (options.production && request.get('origin')) {
      try {
        if (new URL(request.get('origin')!).host !== request.get('host')) {
          response.status(400).json({ error: 'Origem da solicitação inválida.' })
          return
        }
      } catch {
        response.status(400).json({ error: 'Origem da solicitação inválida.' })
        return
      }
    }
    const parsed = leadRequestSchema.safeParse(request.body)
    if (!parsed.success || parsed.data.website) {
      response.status(400).json({ error: 'Confira os campos e tente novamente.' })
      return
    }
    if (!available || !transport) {
      response.status(503).json({ error: 'O formulário está temporariamente indisponível. Tente novamente mais tarde.' })
      return
    }
    cleanCache()
    const { requestId } = parsed.data
    const normalized = { ...parsed.data, whatsapp: normalizeBrazilianPhone(parsed.data.whatsapp) }
    const hash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
    const completed = delivered.get(requestId)
    const existing = pending.get(requestId)
    if ((completed && completed.hash !== hash) || (existing && existing.hash !== hash)) {
      response.status(400).json({ error: 'A solicitação mudou. Atualize a página e tente novamente.' })
      return
    }
    if (completed) {
      response.json({ ok: true, stored: true, requestId })
      return
    }
    let operation = existing?.promise
    if (!operation) {
      operation = Promise.resolve().then(() => transport(normalized)).then((confirmation) => {
        if (confirmation.stored !== true || confirmation.requestId !== requestId) throw new Error('Storage not confirmed')
        delivered.set(requestId, { hash, at: Date.now() })
      })
      pending.set(requestId, { hash, promise: operation, at: Date.now() })
      void operation.then(() => pending.delete(requestId), () => pending.delete(requestId))
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        operation,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('SEND_TIMEOUT')), options.timeoutMs ?? 45000)
        }),
      ])
      response.json({ ok: true, stored: true, requestId })
    } catch (error) {
      const timedOut = error instanceof Error && (error.message === 'SEND_TIMEOUT' || ['TimeoutError', 'AbortError'].includes(error.name))
      response.status(timedOut ? 504 : 502).json({
        error: timedOut
          ? 'O envio está demorando. Tente novamente para consultar a mesma solicitação.'
          : 'Não foi possível enviar agora. Seus dados foram mantidos para tentar novamente.',
      })
    } finally {
      clearTimeout(timer)
    }
  })
  app.all('/api/leads', (_request, response) => {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Método não permitido.' })
  })
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Não encontrado.' })
  })
  const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
    const tooLarge = error?.type === 'entity.too.large'
    response.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'A solicitação é muito grande.' : 'Solicitação inválida.' })
  }
  app.use(handleError)
  return app
}
