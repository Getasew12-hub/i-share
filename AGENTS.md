# i-Share Development Rules

These rules are permanent guidance for contributors and AI coding agents working on i-Share.

## Product And Scope

- Read `docs/requirements.md`, `docs/business-rules.md`, and the relevant architecture documents before implementing features.
- Treat the complete business specification as the primary source of truth when it is available.
- Follow `docs/business-rules.md`.
- Do not invent unspecified business logic.
- Document ambiguous or missing business decisions under "Decision Required".
- Do not implement major marketplace features before their phase is approved.

## Engineering Standards

- Use TypeScript throughout the client and server.
- Keep controllers thin.
- Put business logic in services.
- Use repositories for database access once persistence logic is introduced.
- Validate all external input with schemas before it reaches business logic.
- Prefer Zod for request validation and typed contracts.
- Do not modify unrelated code.
- Avoid unnecessary dependencies.
- Keep documentation synchronized with architectural changes.

## Security And Authorization

- Never trust client-supplied IDs.
- Always enforce authorization on the backend.
- Vendors can access only their own resources unless an administrator workflow explicitly permits otherwise.
- Customers can access only their own resources unless an administrator workflow explicitly permits otherwise.
- Never expose passwords or sensitive information.
- Never store plaintext passwords.
- Never expose secrets to the frontend.
- Do not put security-critical validation only in the frontend.
- Apply RBAC checks consistently at service or middleware boundaries.
- Create audit records for security-sensitive and business-critical actions when the audit system is implemented.

## Data Integrity

- Use database transactions when atomicity is required.
- Design booking operations to prevent race conditions.
- Product availability and booking overlap prevention must be enforced by the backend and database, not only by UI checks.
- Use foreign keys, unique constraints, indexes, and database constraints where they protect business rules.

## Testing And Completion

- Write tests for important business rules.
- Run type checking, linting, formatting checks, and tests before considering a task complete.
- Add regression tests when fixing defects.
- Do not leave known errors.
