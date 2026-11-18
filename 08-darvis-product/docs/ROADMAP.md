# Delivery Roadmap

The project is delivered in small, verifiable vertical slices. A milestone is complete only when its acceptance criteria are met.

## Phase 0 — Product foundation
- [x] Create an isolated product workspace.
- [x] Record product vision and initial architecture.
- [x] Define security baseline and delivery sequence.
- [ ] Review the inherited Claude backend against the target architecture.
- [ ] Confirm supported runtime versions and dependency compatibility.

Exit criteria: architecture and repository layout are internally consistent; inherited code is not copied blindly.

## Phase 1 — Secure application skeleton
- [ ] Establish web and API application structure.
- [ ] Add environment examples with placeholders only.
- [ ] Add configuration validation and safe startup behavior.
- [ ] Add PostgreSQL connection, SQLAlchemy setup, and Alembic baseline.
- [ ] Add API health/readiness endpoints.
- [ ] Add CI for lint, type checks, tests, and build.
- [ ] Add local development instructions.

Exit criteria: clean setup documented; API and web can start in a controlled environment; CI checks run successfully.

## Phase 2 — Identity and core domain
- [ ] Implement registration/bootstrap strategy for a single-owner deployment.
- [ ] Implement secure login, logout, refresh rotation, and revocation.
- [ ] Add current-user endpoint.
- [ ] Add task and project CRUD with ownership enforcement.
- [ ] Add persistent audit events.
- [ ] Add API integration tests.

Exit criteria: authenticated user can create and retrieve their own task/project; unauthorized access is rejected and tested.

## Phase 3 — Cognitive Cockpit
- [ ] Rebuild shared design tokens, typography, navigation, and responsive shell from Stitch.
- [ ] Implement Command Center with real API data.
- [ ] Add loading, empty, error, offline, and success states.
- [ ] Add accessibility and responsive checks.

Exit criteria: interface is usable on desktop and mobile and displays only real backend state.

## Phase 4 — Assistant and provider abstraction
- [ ] Define provider-neutral request/response contracts.
- [ ] Integrate first provider behind server-side adapter.
- [ ] Add explicit context selection and minimization.
- [ ] Add conversation persistence and retention controls.
- [ ] Add strict tool proposal schema and allowlist.
- [ ] Add server-side approval and idempotent execution.

Exit criteria: assistant can propose a safe, typed task action; approval is enforced by the API and recorded.

## Phase 5 — Memory and Obsidian
- [ ] Define structured memory schema and lifecycle.
- [ ] Define vault folder and frontmatter conventions.
- [ ] Implement explicit import/export/sync operations.
- [ ] Add conflict handling, indexing, and deletion propagation.
- [ ] Add user-visible provenance and sync status.

Exit criteria: a note can be safely synchronized without silently overwriting user data.

## Phase 6 — Integrations and automation
- [ ] Build integration registry and scoped credential storage.
- [ ] Add Telegram and selected Google integrations.
- [ ] Add scheduled jobs with retry and idempotency.
- [ ] Add execution history, approvals, and kill switch.

Exit criteria: every integration exposes real status, permissions, failures, and revocation.

## Phase 7 — Voice, PWA, and desktop companion
- [ ] Add speech input with clear recording state and user consent.
- [ ] Add PWA install/offline behavior where appropriate.
- [ ] Evaluate a Windows companion only after API and permission boundaries are stable.

## Release gates

No production release without automated tests and dependency/security checks; secret scanning; database backup and restore procedure; authentication and authorization review; rate limits and abuse protections; privacy/retention policy; deployment rollback plan; verified health, logs, and alerting.
