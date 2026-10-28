import { z } from 'zod'
import type { LeadRequest } from '../shared/lead-schema.ts'

export type LeadTransport = (lead: LeadRequest) => Promise<{ requestId: string; stored: true }>

export function isValidKestraWebhook(value: string): boolean {
  try {
    const url = new URL(value)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return !url.username && !url.password && !url.hash && (url.protocol === 'https:' || (url.protocol === 'http:' && loopback))
  } catch {
    return false
  }
}

const outputSchema = z.object({
  ok: z.literal(true), stored: z.literal(true), requestId: z.uuid(), spreadsheetId: z.string().trim().min(1),
})

export function createKestraTransport(options: { webhookUrl: string; authorization?: string; timeoutMs?: number }): LeadTransport {
  if (!isValidKestraWebhook(options.webhookUrl)) throw new Error('Invalid webhook configuration')
  const url = new URL(options.webhookUrl)
  url.searchParams.set('wait', 'true')
  url.searchParams.set('returnOutputs', 'true')
  return async (lead) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.authorization ? { Authorization: options.authorization } : {}),
      },
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs ?? 45000),
      body: JSON.stringify(lead),
    })
    if (!response.ok) throw new Error('Destination rejected the request')
    const body: unknown = await response.json()
    const confirmed = outputSchema.safeParse(body)
    if (!confirmed.success || confirmed.data.requestId !== lead.requestId) throw new Error('Storage not confirmed')
    return { requestId: confirmed.data.requestId, stored: true }
  }
}
