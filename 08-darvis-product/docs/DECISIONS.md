# Architecture Decision Log

## ADR-001 — Preserve prototypes and create a new product workspace
- Status: Accepted
- Decision: keep all six prototypes unchanged and build the integrated product under `08-darvis-product/`.
- Reason: preserve provenance, avoid destructive consolidation, and make the product implementation independently reviewable.

## ADR-002 — Use the Claude FastAPI backend as the primary implementation reference
- Status: Accepted as a starting point; code reuse requires review
- Decision: use its domain/API structure as the first backend reference, not as production-ready code.
- Reason: it has the strongest backend foundation among the audited prototypes.
- Consequence: authentication, refresh rotation, rate limiting, audit coverage, migrations, and deployment behavior must be hardened.

## ADR-003 — Use Stitch Cognitive Cockpit as the official visual reference
- Status: Accepted
- Decision: reproduce its design language and selected layouts in a maintainable component system.
- Reason: it best expresses the intended product identity.
- Consequence: visual states must be connected to real data and operations; decorative mock behavior must not be carried into production.

## ADR-004 — PostgreSQL is the operational source of truth
- Status: Accepted
- Decision: store operational entities, identity, sessions, conversations metadata, structured memories, and audit events in PostgreSQL.
- Reason: transactional integrity, queryability, authorization, and reliable workflows.
- Consequence: browser storage is limited to non-authoritative preferences/cache.

## ADR-005 — Obsidian is a knowledge/document layer, not the transactional database
- Status: Accepted
- Decision: use Markdown/Obsidian for long-form notes and knowledge, integrated through an adapter.
- Reason: human-readable, portable, user-owned knowledge.
- Consequence: synchronization requires conflict detection, provenance, and explicit deletion semantics.

## ADR-006 — AI providers are replaceable adapters
- Status: Accepted
- Decision: isolate provider-specific SDKs behind a server-side interface.
- Reason: privacy, cost, availability, and model capabilities can change.
- Consequence: no provider-specific types leak into domain services or browser contracts.

## ADR-007 — AI cannot execute tools directly
- Status: Accepted
- Decision: AI may propose typed actions; the API validates, authorizes, obtains approval, and executes them.
- Reason: safety, predictability, and auditability.
- Consequence: tool registry, approval records, idempotency, and audit events are core backend capabilities.
