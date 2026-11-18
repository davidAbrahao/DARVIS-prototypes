# D.A.R.V.I.S. — Product Workspace

**David Abrahão Rodrigues Virtual Intelligence System**

This directory is the beginning of the integrated product. The six prototype projects remain preserved as reference material; this workspace is where the production-oriented application will be assembled.

## Product principle

D.A.R.V.I.S. is a personal intelligence system: it should understand user-approved context, organize knowledge and work, help make decisions, and execute explicitly authorized actions with traceability. It is not merely a chatbot or a decorative dashboard.

## Experience

The official visual direction is the **Cognitive Cockpit**, based on the Google Stitch prototype:
- Deep Space `#080C14`
- Graphite `#111827`
- Electric Cyan `#38BDF8`
- Operational Green `#10B981`
- Space Grotesk, Geist, and JetBrains Mono

The interface must be responsive, accessible, calm under information density, and honest: every status, metric, connection, and execution indicator must reflect real system state.

## Initial technical direction

- Web: Next.js, React, TypeScript, PWA.
- API: FastAPI, Python, Pydantic.
- Persistence: PostgreSQL, SQLAlchemy, Alembic.
- Knowledge: Markdown/Obsidian integration behind an explicit adapter.
- AI: provider abstraction; Gemini is the first candidate, not a hard dependency.
- Execution: server-side tools with authorization, approval, idempotency, and audit records.

These are architecture decisions for the new product workspace, not claims that the stack is already implemented.

## First delivery

The first milestone is a secure vertical slice: API health and configuration validation; database connection and initial migration; authentication and current-user endpoint; responsive Cognitive Cockpit shell; authenticated API client and real system status; CI checks and setup documentation.

## Repository map

- `docs/PRODUCT_VISION.md`: product principles and user experience.
- `docs/ARCHITECTURE.md`: target system boundaries and data flow.
- `docs/ROADMAP.md`: incremental delivery plan and acceptance criteria.
- `docs/SECURITY_BASELINE.md`: minimum security requirements.
- `docs/DECISIONS.md`: architecture decision log.

## Non-negotiable engineering rules

- Never put secrets in source control or browser bundles.
- Never treat local UI state as authoritative persistence.
- Never let an LLM directly execute arbitrary code or SQL.
- Validate tool names and payloads on the server using allowlists and typed schemas.
- Require server-side authorization for sensitive actions.
- Record approval and execution outcomes in persistent audit logs.
- Do not display simulated values as live telemetry.
- Preserve the six source prototypes unchanged.
- Do not claim tests or deployments passed until they have actually run.
