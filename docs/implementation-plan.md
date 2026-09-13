# Implementation Plan

## Phase 1 - Project Foundation

Objective: Establish the monorepo, documentation, tooling, and minimal runnable apps.

Features:

- React/Vite client.
- Express/TypeScript server.
- Health endpoint.
- Environment examples.
- ESLint, Prettier, TypeScript, tests.
- Initial documentation.

Dependencies:

- Node.js and npm.

Important Business Rules:

- BR-024, BR-026.

Testing Requirements:

- Backend health endpoint test.
- Type checking.
- Linting.
- Formatting check.

## Phase 2 - Database

Objective: Implement the approved PostgreSQL and Prisma schema.

Status: Implemented in the Prisma schema and initial migration. Applying the migration to a live PostgreSQL database remains environment-dependent and must be verified with a configured `DATABASE_URL`.

Features:

- Core entities.
- Migrations.
- Indexes and constraints.
- Booking overlap prevention strategy.

Dependencies:

- Approved database design.
- Complete business specification.

Important Business Rules:

- BR-010 through BR-014, BR-028.

Testing Requirements:

- Migration tests where practical.
- Repository tests for constraints and relationships.
- Booking overlap constraint tests.

## Phase 3 - Authentication

Objective: Implement secure account authentication.

Status: Implemented for customer and vendor registration, login, access tokens, rotating refresh sessions, logout, current user, email-verification foundation, backend auth middleware, RBAC/ownership guard foundations, frontend auth foundation, and automated auth/RBAC tests. Applying the new auth migration to a live PostgreSQL database remains environment-dependent and must be verified with a configured `DATABASE_URL`.

Features:

- Customer and vendor registration.
- Login.
- Access token issuing.
- Secure HttpOnly refresh cookie.
- Refresh-token rotation, revocation, and replay-family revocation.
- Password hashing.
- Email-verification token foundation.
- Authentication middleware.
- RBAC and resource-ownership middleware foundations.
- Frontend auth service/provider and login/register screens.

Dependencies:

- User schema.
- Token policy decisions.

Important Business Rules:

- BR-015, BR-025, BR-026, BR-027.

Testing Requirements:

- Password hashing tests.
- Login failure tests.
- Token validation tests.
- Refresh rotation and replay tests.
- Role and ownership authorization tests.

## Phase 4 - RBAC And Vendor Verification

Objective: Enforce roles and ownership boundaries, then complete vendor onboarding and administrator verification.

Status: Implemented for backend role checks, ownership guard foundations, vendor profile completion, vendor verification document metadata, vendor submission, admin pending-vendor review, approval, rejection with reason, rejected-vendor resubmission, approved-vendor guard foundation, frontend onboarding/admin review screens, and automated vendor verification tests. Applying the Phase 4 migration to a live PostgreSQL database remains environment-dependent and must be verified with a configured `DATABASE_URL`.

Features:

- Role middleware.
- Ownership checks.
- Protected route patterns.
- Vendor profile completion.
- Verification submission.
- Admin review workflow.
- Vendor approval and rejection.
- Rejected vendor resubmission.
- Approved-vendor authorization foundation for later listing workflows.

Dependencies:

- Authentication.
- User roles.
- Vendor schema.

Important Business Rules:

- BR-001 through BR-005.
- BR-006, BR-007, BR-009, BR-009A, BR-009B, BR-009C.

Testing Requirements:

- Role access tests.
- Vendor ownership tests.
- Customer ownership tests.
- Vendor registration tests.
- Verification transition tests.
- Admin-only verification tests.

## Phase 5 - Subscription Management

Objective: Implement the essential vendor subscription foundation without payment-provider integration.

Status: Implemented for subscription plan listing, authenticated vendor subscription selection, current subscription/history reads, plan changes, cancellation foundation, reusable policy checks, frontend subscription page, and automated subscription tests. It reuses the Phase 2 schema without a new migration.

Features:

- Active monthly/yearly subscription plans.
- Vendor-owned subscription lifecycle and history.
- Active-subscription checks that treat expired periods as inactive.
- Product, employee, active-booking, premium-feature, and analytics policy helpers.
- Vendor subscription APIs and frontend foundation.

Dependencies:

- RBAC.
- Vendor verification.
- Subscription schema.

Important Business Rules:

- BR-008, BR-021.

Testing Requirements:

- Active and expired subscription checks.
- Plan limit tests.
- Premium feature and analytics access tests.
- Vendor ownership and role authorization tests.
- Invalid operation tests.

## Phase 6 - Product And Availability Management

Objective: Allow eligible vendors to manage rentable product listings and availability, while exposing only published products publicly.

Status: Implemented for vendor-owned product creation, reads, updates, status changes, archival deactivation, product image and document metadata, category listing, vendor-managed availability periods, public published-product listing/detail APIs, frontend vendor product management, frontend public product browsing, and automated product-service tests. It reuses the Phase 2 product, category, media/document, and availability schema without a new migration.

Features:

- Public category listing.
- Public published-product listing and detail views.
- Vendor-owned product CRUD foundation.
- Vendor-managed product status changes for draft, published, unpublished, and archived states.
- Product archival instead of destructive deletion.
- Product image and document metadata attachment.
- Vendor-owned availability period management for available, maintenance, and blocked periods.
- Frontend vendor product management screen.
- Frontend public product listing and detail screens.

Dependencies:

- RBAC.
- Vendor verification.
- Active subscription and subscription product-limit policy helpers.
- Phase 2 product, category, media/document, and availability schema.

Important Business Rules:

- BR-007, BR-008, BR-010, BR-011.
- BR-014A through BR-014F.
- BR-021, BR-024, BR-027, BR-029.

Testing Requirements:

- Vendor ownership and role authorization tests.
- Product creation and update validation tests.
- Publishing eligibility tests for approved vendors, active subscriptions, and plan product limits.
- Product archival/deactivation tests.
- Public published-product visibility tests.
- Availability date validation and ownership tests.

## Phase 7 - Search And Marketplace

Objective: Let customers discover published rental products through public marketplace listing and detail pages.

Status: Implemented for public published-product listing, product detail, product/category search, category filtering by slug or ID, price filtering, location filtering, available-date filtering, sorting, pagination, public-data response shaping, frontend marketplace UI, automated service tests, and API/business-rule documentation. It reuses the Phase 2 schema without a new migration.

Features:

- Public marketplace product listing.
- Public product detail.
- Product/category search.
- Category, price, location, and available-date filters.
- Newest and name sorting.
- Pagination.
- Public response shaping that excludes vendor IDs, product metadata, documents, image storage keys, and image metadata.
- Frontend marketplace listing and detail screens.

Dependencies:

- RBAC.
- Vendor verification.
- Subscription system.
- Product and category data.

Important Business Rules:

- BR-011, BR-014D, BR-024, BR-027, BR-029.

Testing Requirements:

- Search and filter tests.
- Sorting and pagination tests.
- Public visibility tests for unpublished products.
- Public-data security tests.

## Phase 8 - Booking + Rental Lifecycle + Availability

Objective: Model rentable availability and implement customer/vendor booking and rental lifecycle workflows.

Status: ✓ **COMPLETE**. Implemented for availability checking with conflict detection, availability schedule queries, backend availability service with date-boundary and overlap logic, availability controller/routes/schemas, frontend booking pages (customer my-bookings, booking detail, vendor bookings, vendor booking detail, create booking), public product detail "Book Now" integration, customer booking creation/cancellation, vendor booking confirmation/rejection, rental lifecycle (start/complete/late-return), pricing snapshot capture, server-side price calculation, and comprehensive availability/booking/rental lifecycle tests. It reuses the Phase 2 availability, booking, and rental schema without new migrations.

Features:

- Availability windows and blackout rules (AVAILABLE, MAINTENANCE, BLOCKED, RESERVED).
- Availability queries with date range checking and overlap detection.
- Availability checking with conflict detection for blocked, maintenance, and reserved periods.
- Availability schedule queries for product rental windows.
- Customer booking creation with date/quantity/product validation and availability gating.
- Customer booking list/detail views with full booking state.
- Customer booking cancellation (PENDING, CONFIRMED states only).
- Vendor booking list/detail views with ownership enforcement.
- Vendor booking confirmation and rejection with authorization checks.
- Vendor booking cancellation with proper state transitions.
- Rental lifecycle: creation, start (PICKUP event), completion (RETURN event), and late-return handling.
- Rental event tracking (PICKUP, RETURN, LATE_RETURN, DAMAGE_ASSESSMENT).
- Server-side price calculation based on duration and pricing model.
- Price snapshot capture at booking creation for invoice/dispute protection.
- Overlapping booking prevention enforced by database exclusion constraint.
- Race condition prevention through database transactions.
- Frontend customer booking management (list, detail, cancel).
- Frontend vendor booking management (list, detail, confirm, reject, cancel, rental lifecycle).
- Public product detail "Book Now" integration with availability gating.
- Request context tracking (IP address, user agent) for audit trails.

Dependencies:

- Approved availability model from Phase 6.
- Product and category data from Phase 6.
- Authentication and RBAC from Phase 3-4.
- Subscription system and active-subscription checks from Phase 5.
- Phase 2 database schema (no new migrations required).

Important Business Rules:

- BR-011 (Product availability checks).
- BR-012 (No overlapping bookings).
- BR-013 (Backend overlap enforcement).
- BR-014 (Race condition prevention).
- BR-014B (Product ownership from authenticated vendor).
- BR-015 (Customer registration required).
- BR-016 (Rental duration required).
- BR-017 (Duration-based pricing).
- BR-019 (Pickup/return tracking).
- BR-020 (Completed rentals only for reviews).
- BR-028 (Database transactions for atomicity).

Testing Requirements:

- Available/unavailable date tests (15 tests in availability-service.test.ts).
- Edge tests for date boundaries and overlap handling.
- Overlap conflict tests for blocked, maintenance, and reserved periods.
- Booking creation, validation, and cancellation tests (21 tests in booking-service.test.ts).
- Vendor confirm/reject authorization tests.
- Rental lifecycle transition tests (start, complete, late return).
- Customer/vendor authorization and ownership tests (10 tests in authorization.test.ts).
- Concurrent booking tests (database schema tests for exclusion constraints).
- Price calculation tests for HOURLY, DAILY, WEEKLY, MONTHLY pricing models.
- Database-level integrity tests for booking overlap constraints (4 tests in database-schema.test.ts).

## Phase 9 - Search And Filtering

Objective: Let customers discover products.

Status: Superseded by the Phase 7 public marketplace search foundation. Future work here should be limited to approved advanced discovery behavior such as ranking, saved searches, geospatial search, or full-text search.

Features:

- Product search.
- Filters.
- Sorting.
- Pagination.

Dependencies:

- Product and category data.
- Approved search requirements.

Important Business Rules:

- BR-011.

Testing Requirements:

- Filter tests.
- Pagination tests.
- Visibility tests for unpublished products.

## Phase 10 - Booking System

Objective: Create and manage rental bookings without overlap.

Features:

- Booking creation.
- Booking status model.
- Overlap prevention.
- Booking ownership views.

Dependencies:

- Availability system.
- Customer authentication.
- Database constraints.

Important Business Rules:

- BR-012 through BR-016, BR-028.

Testing Requirements:

- Concurrent booking tests.
- Overlap tests.
- Customer authorization tests.

## Phase 11 - Pricing

Objective: Calculate rental costs from approved pricing rules.

Features:

- Duration calculation.
- Product pricing.
- Total calculation.

Dependencies:

- Approved pricing rules.
- Product and booking data.

Important Business Rules:

- BR-016, BR-017.

Testing Requirements:

- Unit pricing tests.
- Boundary duration tests.
- Currency tests.

## Phase 12 - Payments

Objective: Collect and confirm payments for rentals and subscriptions.

Features:

- Payment initiation.
- Payment status.
- Webhooks.
- Idempotency.

Dependencies:

- Payment provider decision.
- Booking and subscription systems.

Important Business Rules:

- BR-018, BR-022, BR-023.

Testing Requirements:

- Webhook signature tests.
- Idempotency tests.
- Payment state transition tests.

## Phase 13 - Rental Lifecycle

Objective: Track pickup, active rental state, and return.

Features:

- Pickup confirmation.
- Return confirmation.
- Rental events.

Dependencies:

- Paid bookings.
- Approved lifecycle rules.

Important Business Rules:

- BR-018, BR-019.

Testing Requirements:

- Lifecycle transition tests.
- Authorization tests.

## Phase 14 - Reviews

Objective: Support reviews for completed rentals.

Features:

- Review creation.
- Review display.
- Rating aggregation if approved.

Dependencies:

- Completed rental lifecycle.

Important Business Rules:

- BR-020.

Testing Requirements:

- Completed-rental-only tests.
- One-review-per-booking tests.

## Phase 15 - Notifications

Objective: Notify users about important account and rental events.

Features:

- Notification persistence.
- Delivery provider integration.
- Read state.

Dependencies:

- Approved channels and templates.

Important Business Rules:

- BR-023, BR-027.

Testing Requirements:

- Trigger tests.
- Delivery job tests.

## Phase 16 - Dashboards

Objective: Provide role-specific operational dashboards.

Features:

- Admin dashboard.
- Vendor dashboard.
- Customer dashboard.

Dependencies:

- Core workflows.

Important Business Rules:

- BR-002, BR-003, BR-004.

Testing Requirements:

- Role visibility tests.
- Ownership tests.

## Phase 17 - Analytics And Reports

Objective: Provide platform, vendor, and operational reporting.

Features:

- Revenue reports.
- Booking reports.
- Product performance.
- Export if approved.

Dependencies:

- Payments, bookings, products.
- Approved metrics.

Important Business Rules:

- BR-002, BR-027.

Testing Requirements:

- Metric calculation tests.
- Access control tests.

## Phase 18 - Security Hardening

Objective: Harden application security before production.

Features:

- Rate limiting.
- Security headers.
- Audit logging.
- Secret handling.
- Input validation review.

Dependencies:

- Core workflows.

Important Business Rules:

- BR-024 through BR-029.

Testing Requirements:

- Security regression tests.
- Authorization coverage review.

## Phase 19 - Testing

Objective: Broaden automated test coverage across critical paths.

Features:

- Unit tests.
- Integration tests.
- API tests.
- Frontend workflow tests.

Dependencies:

- Implemented feature phases.

Important Business Rules:

- All approved business rules.

Testing Requirements:

- Business-rule coverage.
- Error and edge case coverage.

## Phase 20 - Deployment

Objective: Prepare production deployment.

Features:

- CI/CD.
- Production builds.
- Migration process.
- Monitoring and logging.

Dependencies:

- Hosting decisions.
- Security hardening.

Important Business Rules:

- BR-026, BR-027, BR-029.

Testing Requirements:

- Build verification.
- Smoke tests.
- Migration dry runs.
