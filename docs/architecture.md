# Architecture

## Overview

i-Share uses a monorepo with separate `client` and `server` workspaces.

- `client`: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form, and Zod.
- `server`: Node.js, Express, TypeScript, Prisma, PostgreSQL, and Zod.
- `docs`: Product, architecture, API, data, and implementation planning documents.

The current foundation includes the backend health endpoint, authentication, RBAC/ownership middleware, vendor onboarding and verification workflows, subscription management foundation, product and availability management, public published-product browsing APIs, and frontend screens for login, registration, vendor onboarding, administrator vendor review, vendor subscriptions, vendor products, and public products.

## Frontend Architecture

The frontend is organized by responsibility:

- `components`: Reusable UI components.
- `pages`: Route-level screens.
- `layouts`: Shared route shells.
- `routes`: Router definitions.
- `services`: API clients and service wrappers.
- `hooks`: Shared React hooks.
- `lib`: Utility functions and shared helpers.
- `types`: Shared frontend types.

React Router owns client-side routing. TanStack Query should own server-state fetching, caching, retries, and invalidation once feature APIs are introduced. React Hook Form and Zod should validate form state before submit, while the backend remains the source of truth.

## Backend Architecture

The backend uses layered Express modules:

- `routes`: URL registration and middleware composition.
- `controllers`: HTTP request and response handling only.
- `schemas`: Zod request validation schemas.
- `services`: Business workflows and rule enforcement.
- `repositories`: Prisma database access.
- `middleware`: Cross-cutting HTTP behavior.
- `config`: Environment and application configuration.
- `utils`: Shared utilities.
- `types`: Shared backend type declarations.

Controllers should stay thin. Services should enforce business rules. Repositories should hide persistence details when database-backed features are implemented.

## API Architecture

The API is versioned under `/api/v1`. Implemented endpoint groups:

- `GET /api/v1/health`
- `/api/v1/auth`
- `/api/v1/vendors`
- `/api/v1/admin/vendors`
- `/api/v1/subscriptions`
- `/api/v1/products`

Planned endpoint groups:

- `/api/v1/users`
- `/api/v1/categories`
- `/api/v1/bookings`
- `/api/v1/payments`
- `/api/v1/reviews`
- `/api/v1/notifications`
- `/api/v1/subscriptions`
- `/api/v1/admin`

API responses should use consistent success and error envelopes once feature work begins.

## Authentication Architecture

Phase 3 implements email/password authentication for customer and vendor registration. Public administrator registration is intentionally not implemented.

- Passwords are hashed with Node.js `scrypt` and never returned by API responses.
- Access tokens are backend-signed HMAC-SHA256 JWTs with a default 15-minute lifetime.
- Refresh credentials are opaque random tokens stored client-side only in secure HttpOnly cookies and stored server-side only as keyed hashes.
- Refresh tokens rotate on every refresh. Reuse of an already revoked refresh token revokes the whole session family.
- Logout revokes the current refresh session and clears the refresh cookie.
- Email verification has a database and API foundation, but email delivery is deferred until provider decisions are approved.

Decision Required:

- Password reset workflow.
- Email provider and verification email template.
- Whether token lifetimes should differ by role or deployment environment.

## Authorization Architecture

RBAC is enforced on the backend with authentication and role middleware. Ownership guard helpers exist for vendor-owned and customer-owned resources and must be composed into future resource routes. Phase 4 vendor verification routes use authenticated user context for vendor-owned onboarding data and admin-only routes for review actions. An approved-vendor guard is available as a foundation for future listing workflows.

Base roles:

- Super Administrator
- Vendor
- Customer

Authorization must include ownership constraints:

- Vendors can access only their own vendor resources.
- Customers can access only their own customer resources.
- Super Administrator access must be explicit and auditable.

## Vendor Verification Architecture

Vendor registration creates a draft vendor profile. Email verification can move the vendor lifecycle into business-profile completion. Vendors can update their own onboarding profile, attach verification document metadata, and submit complete profiles for administrator review.

Administrators can list pending vendor profiles, inspect a vendor review payload, approve pending submissions, or reject pending submissions with a reason. Submission, approval, rejection, profile update, document metadata creation, and admin review reads create audit records where implemented, and submission/review decisions create persisted account-verification notifications.

Verification document binary storage is still deferred to the file-storage decision; Phase 4 stores metadata and ownership in PostgreSQL only.

## Database Architecture

PostgreSQL is the system of record. Prisma manages the application data model.

Database design must include:

- Normalized entities for users, vendors, subscriptions, products, availability, bookings, payments, reviews, notifications, reports, and audit logs.
- Foreign keys for ownership and lifecycle relationships.
- Indexes for common query paths.
- Transactional booking creation.
- A database-level strategy for preventing overlapping bookings.

## File And Image Architecture

Decision Required:

- Storage provider.
- Image processing requirements.
- Verification document retention.
- Access control for private documents.

Expected direction:

- Store files outside the database.
- Store metadata and ownership in PostgreSQL.
- Use signed URLs or equivalent controlled access for private files.
- Product images may be public; verification and dispute evidence should be private.

## Notification Architecture

Decision Required:

- Notification channels.
- Provider.
- Delivery retries.
- Templates.
- User preference model.

Expected direction:

- Persist notification records in PostgreSQL.
- Send transactional notifications for account, booking, payment, pickup, return, review, and administrative events.
- Keep provider delivery separate from core business transactions where possible.

## Payment Architecture

Decision Required:

- Payment provider.
- Currency and tax rules.
- Deposits, refunds, platform fees, and vendor payouts.
- Webhook verification and replay behavior.

Expected direction:

- Treat provider webhooks as untrusted external input until signature validation passes.
- Store payment intent and transaction records.
- Use idempotency keys for payment-related operations.
- Activate rentals only after confirmed payment.

## Deployment Architecture

Decision Required:

- Hosting provider.
- CI/CD platform.
- Runtime topology.
- Managed PostgreSQL provider.
- Object storage provider.

Expected direction:

- Build client as static assets.
- Run server as a Node.js service.
- Use managed PostgreSQL.
- Keep secrets in the deployment platform's secret manager.
- Run migrations as a controlled deployment step.
