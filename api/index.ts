import { createLeadApp } from '../server/app.ts'

type TestOverrides = Pick<NonNullable<Parameters<typeof createLeadApp>[0]>, 'transport' | 'available' | 'timeoutMs' | 'rateLimitMax'>

/** Vite assets stay on the CDN; this singleton only handles the original /api paths. */
export function createVercelApp(environment: NodeJS.ProcessEnv = process.env, overrides: TestOverrides = {}) {
  const app = createLeadApp({
    webhookUrl: environment.KESTRA_LEAD_WEBHOOK_URL,
    authorization: environment.KESTRA_AUTHORIZATION,
    production: true,
    ...overrides,
  })

  // Vercel replaces incoming X-Forwarded-For. Trust its closest hop only;
  // direct localhost/self-hosted requests retain Express's default distrust.
  // https://vercel.com/docs/headers/request-headers#x-forwarded-for
  if (environment.VERCEL === '1') app.set('trust proxy', 1)
  return app
}

// Do not import server/index.ts here: it starts a listener and serves local dist.
// Module scope preserves the limiter/pending cache across warm invocations.
export default createVercelApp()
