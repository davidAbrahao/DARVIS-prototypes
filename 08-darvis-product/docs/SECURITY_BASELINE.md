# Security Baseline

This document defines minimum requirements. It is not a claim that these controls are already implemented.

## Secrets
- Commit placeholders only; never commit real API keys, passwords, signing keys, or certificates.
- Load secrets from environment or a managed secret store.
- Fail startup when required production secrets are missing or use known placeholders.
- Never expose provider credentials to the browser.
- Rotate any credential suspected to have entered source control.

## Authentication
- Hash passwords with Argon2id using reviewed parameters.
- Use short-lived access credentials.
- Rotate refresh tokens on every successful refresh.
- Detect refresh-token reuse and revoke the affected session family.
- Support logout and server-side session revocation.
- Rate-limit login, registration/bootstrap, refresh, and password-reset flows.
- Avoid account-enumeration differences in authentication responses.

## Authorization
- Deny by default.
- Enforce ownership and permissions in the API/service layer, not only in UI routing.
- Validate authorization again when an AI-proposed action is approved.
- Scope integration credentials to the minimum required permissions.

## AI and tool execution
- Treat model output as untrusted input.
- Use strict schemas and explicit tool allowlists.
- Reject unknown action types and unexpected fields.
- Bound payload size, string length, array size, and execution time.
- Never execute arbitrary shell, Python, SQL, or browser instructions from model output.
- Require explicit approval for consequential actions.
- Use idempotency keys and persistent execution state.
- Separate proposal, approval, execution, and result records.

## Data and privacy
- Minimize context sent to providers.
- Make context categories visible and configurable.
- Do not send sensitive data by default.
- Document provider, region, retention, training use, and applicable terms before enabling a provider.
- Provide data export and deletion paths.
- Avoid logging prompts, tokens, secrets, or unnecessary personal content.

## API and infrastructure
- Enforce HTTPS in deployed environments.
- Configure explicit CORS origins.
- Add request size limits and rate limits.
- Validate all request bodies and query parameters.
- Use secure headers and trusted proxy configuration.
- Separate liveness and readiness checks.
- Run database migrations as a controlled deployment step, not concurrently from every application replica.
- Maintain encrypted backups and test restoration.
- Pin and review dependencies; run automated vulnerability checks.

## Auditability

Persist security-relevant events with actor, action, resource, timestamp, correlation ID, decision, and outcome. Audit records must not be editable through ordinary application endpoints.

## Release rule

Any unresolved critical/high security issue blocks production release. Development convenience must never silently weaken production defaults.
