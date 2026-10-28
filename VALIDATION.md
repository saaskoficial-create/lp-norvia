# Validation

The landing page has been reviewed at mobile, tablet, and desktop widths, including reduced motion and keyboard navigation. Production build, TypeScript and lint pass.

The lead service has isolated tests covering required configuration, field validation, honeypot, normalized contact data, idempotency, concurrency, timeouts, origin checks, rate limits and strict confirmation of storage. The Python integration has isolated tests covering the Sheets schema, RAW writes, durable deduplication and read-back confirmation.

A labeled fictional lead was submitted through the mobile UI to the real Kestra flow and Google Sheet. The same request was replayed directly without creating a duplicate row. Success analytics fired once and contained no contact data. Private execution IDs, credentials and test records remain outside this repository.

Local Lighthouse measurements before the final confirmation-spacing adjustment: mobile performance 100, accessibility 100 and SEO 100, LCP 1.1 s, CLS 0. These are laboratory measurements, not production field metrics.

The public deployment is validated separately after release, including its API and a labeled fictional end-to-end submission. Deployment results belong in the main README once verified.
