# Validation

The landing page has been reviewed at mobile, tablet, and desktop widths, including reduced motion and keyboard navigation. Production build, TypeScript and lint pass.

The lead service has isolated tests covering required configuration, field validation, honeypot, normalized contact data, idempotency, concurrency, timeouts, origin checks, rate limits and strict confirmation of storage. The Python integration has isolated tests covering the Sheets schema, RAW writes, durable deduplication and read-back confirmation.

Before publication, a labeled fictional lead was submitted through the local mobile UI to the real Kestra flow and Google Sheet. The same request was replayed directly without creating a duplicate row. Success analytics fired once and contained no contact data. Private execution IDs, credentials and test records remain outside this repository.

Local Lighthouse measurements before the final confirmation-spacing adjustment: mobile performance 100, accessibility 100 and SEO 100, LCP 1.1 s, CLS 0. These are laboratory measurements, not production field metrics.

The source repository [saaskoficial-create/lp-norvia](https://github.com/saaskoficial-create/lp-norvia) is public, with `main` as its default branch. GitHub Actions passed installation, lint, TypeScript tests, Python tests and the production build on Linux for commit `154c04c2204fba7172f3504caf14c20c0cd3336b`. The suite contains 19 TypeScript tests and 18 Python tests. The optional-dependency lockfile was regenerated in a clean Node 24 Linux container. [Verified CI run](https://github.com/saaskoficial-create/lp-norvia/actions/runs/40765207221).

Production is published at [lp-norvia.vercel.app](https://lp-norvia.vercel.app/) in the Saask Vercel team (`saask1`), with deployment status **Ready**. The canonical, Open Graph URL and absolute Open Graph/Twitter image URLs use this public origin.

Public checks passed: homepage HTTP 200; `GET /api/leads/status` HTTP 200 with `available:true`; `GET /api/leads` HTTP 405; invalid `POST /api/leads` HTTP 400.

One labeled fictional lead was submitted through the public site's UI. The API returned HTTP 200 with `ok:true`, `stored:true` and the matching request identifier. Exactly one corresponding row was confirmed in **Leads LP**, including consent, attribution and a `+55`-normalized phone number. The `lead_form_success` event appeared exactly once; its keys were `event`, `form_id`, `lead_destination` and GTM's `gtm.uniqueEventId`, with no contact data or request identifier. Private test values and execution identifiers are not included here.

All 18 inspected public assets returned HTTP 200. GTM, local fonts and deferred GSAP loading were checked. No private webhook URL was exposed in the inspected public HTML or JavaScript bundles.
