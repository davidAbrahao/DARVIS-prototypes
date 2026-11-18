# Target Architecture

Status: proposed baseline for the new product workspace. Validate each implementation detail against the code and deployment environment.

## System overview

Browser / Next.js PWA communicates over HTTPS with FastAPI. FastAPI applies authentication and authorization, invokes domain services, persists operational state in PostgreSQL, writes persistent audit events, and delegates knowledge, AI, and external operations to isolated adapters.

## Applications

### Web
- Next.js App Router, React, TypeScript.
- Design tokens and reusable components derived from Stitch.
- Server/client boundaries kept explicit.
- No provider secrets or privileged credentials in browser code.
- Authenticated API access through a single typed client.

### API
- FastAPI with versioned routes.
- Pydantic request/response schemas.
- SQLAlchemy models and repositories.
- Alembic migrations.
- Domain services separated from HTTP handlers.
- Central authorization and audit services.

## Data ownership

| Data | System of record |
|---|---|
| Users, sessions, tasks, projects, goals | PostgreSQL |
| Structured memories and conversation metadata | PostgreSQL |
| Long-form notes and knowledge documents | Markdown vault |
| Integration credentials | Secret manager / deployment secrets |
| Approval and execution history | PostgreSQL audit records |

PostgreSQL is authoritative for operational state. The vault is a knowledge/document store, not a replacement for transactional records.

## AI boundary

The model is an untrusted reasoning component. It may propose structured tool calls, but it cannot directly execute arbitrary commands, SQL, filesystem operations, or network requests.

Required flow: build minimal authorized context; send only context permitted by user settings and provider policy; parse output into a strict schema; reject unknown tools and unexpected fields; persist a pending proposal when approval is required; re-check authorization and proposal state on approval; execute through an allowlisted server-side tool; persist result and audit event.

Provider adapters must expose a common interface and support provider-specific privacy/configuration controls. No provider is assumed to be permanently selected.

## Authentication and authorization

- Passwords hashed with Argon2id.
- Short-lived access credentials and rotating, revocable refresh sessions.
- Refresh token reuse detection.
- Rate limits on authentication and expensive endpoints.
- Authorization enforced on every protected resource.
- Secure, HttpOnly, SameSite cookies preferred for browser sessions where deployment topology permits.
- CSRF protection when cookie-based authentication is used.

## Deployment direction

Candidate deployment: managed Next.js-compatible hosting for web; FastAPI container on Google Cloud Run; managed PostgreSQL; Secret Manager for credentials; Cloudflare for DNS, edge protections, and selected gateway functions where justified.

The deployment topology is not locked until cost, network boundaries, cookie/session strategy, backups, and operational requirements are validated.

## Observability

- Structured application logs with correlation IDs.
- Health and readiness endpoints with distinct semantics.
- Metrics derived from actual operations.
- No personal message content or secrets in routine logs.
- Audit records separated from diagnostic logs.
