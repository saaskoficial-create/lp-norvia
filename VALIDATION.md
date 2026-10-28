# Validation

The landing page has been reviewed at mobile, tablet, and desktop widths, including reduced motion and keyboard navigation. Production build, TypeScript and lint pass.

The lead service has isolated tests covering required configuration, field validation, honeypot, normalized contact data, idempotency, concurrency, timeouts, origin checks, rate limits and strict confirmation of storage. The Python integration has isolated tests covering the Sheets schema, RAW writes, durable deduplication and read-back confirmation.

A labeled fictional lead was submitted through the mobile UI to the real Kestra flow and Google Sheet. The same request was replayed directly without creating a duplicate row. Success analytics fired once and contained no contact data. Private execution IDs, credentials and test records remain outside this repository.

Local Lighthouse measurements before the final confirmation-spacing adjustment: mobile performance 100, accessibility 100 and SEO 100, LCP 1.1 s, CLS 0. These are laboratory measurements, not production field metrics.

The source repository [saaskoficial-create/lp-norvia](https://github.com/saaskoficial-create/lp-norvia) is public, with `main` as its default branch. GitHub Actions passed installation, lint, 19 TypeScript tests, 18 Python tests and the production build on Linux for commit `7fac40b508c794e8bef42dd9e0522ee90e6ab494`. The optional-dependency lockfile was regenerated in a clean Node 24 Linux container. [Verified CI run](https://github.com/saaskoficial-create/lp-norvia/actions/runs/40758499669).

The Vercel adapter is implemented and tested locally. Email sign-in reported that the supplied Saask email address does not have an existing Vercel account. Sign-in with the Saask GitHub account also reported that the social account is not connected to a Vercel user. Deployment awaits the owner's choice to create an account or use another existing account/team. No account has been created and no Vercel deployment has been confirmed. After release, validate the public API and a labeled fictional end-to-end submission; do not equate local success with a published service.
