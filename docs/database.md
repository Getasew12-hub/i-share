# Database Design

## Source Status

Phase 2 is implemented from the Phase 1 docs and the explicit Phase 2 database brief. The complete original i-Share business specification is still not present in the workspace, so unresolved business choices remain documented under "Decision Required".

## Implemented Entities

- `users`: shared identity for administrators, vendors, and customers. Stores role, account status, email verification timestamp, and non-plaintext `password_hash`.
- `refresh_sessions`: revocable, rotating refresh-token sessions. Stores only token hashes and session metadata.
- `email_verification_tokens`: hashed email-verification token records for the future email delivery workflow.
- `vendor_profiles`: vendor business profile, lifecycle stage, verification status, approval/rejection timestamps, rejection reason, and administrator reviewer.
- `customer_profiles`: customer-owned profile data without duplicating shared user identity fields.
- `vendor_documents`: private vendor verification document metadata for future object storage.
- `subscription_plans`: monthly/yearly plan definitions with product, employee, storage, booking, premium feature, and analytics limits.
- `vendor_subscriptions`: vendor subscription lifecycle and history through previous-subscription links.
- `categories`: hierarchical product taxonomy.
- `products`: rentable product listings owned by exactly one vendor and one category, with pricing, deposit, delivery, location, specifications, policies, status, and metadata.
- `product_images` and `product_documents`: file metadata only; PostgreSQL does not store image or document binary data.
- `product_availability_periods`: available, reserved, maintenance, and blocked periods.
- `bookings`: requested rental period, customer, vendor, product, pricing snapshot, charges, discount, total, status, expiration, rejection, and cancellation data.
- `payments`: booking or subscription payment records for Chapa, Stripe, PayPal, Telebirr, bank transfer, or other providers.
- `invoices`: immutable transaction snapshots for paid booking invoices.
- `rentals` and `rental_events`: pickup, expected return, actual return, late return, additional charges, and lifecycle event tracking.
- `damage_reports`: damage description, charge, evidence metadata, and resolution status.
- `reviews`: customer review tied to one completed rental, product, and vendor.
- `notifications`: in-app notification records for account, booking, payment, rental, subscription, message, and system events.
- `conversations`, `conversation_participants`, and `messages`: database foundation for future user-to-user messaging.
- `disputes` and `dispute_messages`: administrator-trackable dispute foundation.
- `audit_logs`: actor, action, resource, timestamp, request context, and metadata for security and business audit trails.

## Important Relationships

- A `User` may have one `VendorProfile` or one `CustomerProfile`; role-based access still must be enforced in backend services and middleware.
- Every `Product` belongs to exactly one `VendorProfile` and one `Category`.
- Every `Booking` belongs to one `Product`, one `VendorProfile`, and one `CustomerProfile`.
- Every `VendorSubscription` belongs to one vendor and one subscription plan, with history represented by `previous_subscription_id`.
- Every `Payment` belongs to exactly one payable target: either a booking or a vendor subscription.
- Every `Invoice` belongs to one booking and one payment, and stores snapshots so historical invoices do not change when product or profile data changes.
- Every `Rental` belongs to one booking.
- Every `Review` belongs to one rental, product, vendor, and customer.

## Integrity Constraints

Prisma models define primary keys, foreign keys, unique constraints, required fields, defaults, and query indexes. The initial migration adds PostgreSQL-only constraints for rules Prisma cannot express directly:

- `btree_gist` extension for booking overlap protection.
- Date range checks requiring `starts_at < ends_at` for subscriptions, availability periods, and bookings.
- Non-negative amount and positive count checks for products, bookings, payments, invoices, rentals, damage reports, files, and plan limits.
- Product pricing check requiring the selected pricing model to have a matching rate.
- Composite booking/product/vendor foreign key to ensure a booking's vendor matches the booked product's vendor.
- Review rating check requiring a value from 1 to 5.
- Review trigger requiring the linked rental to be completed and requiring review customer/product/vendor fields to match that rental's booking.

## Booking Overlap Strategy

Overlapping confirmed reservations are prevented at the PostgreSQL layer with an exclusion constraint:

```sql
EXCLUDE USING gist (
  product_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'ACTIVE'));
```

This protects concurrent booking approval flows because PostgreSQL enforces the constraint atomically. The application must still use transactions when transitioning a booking from `PENDING` to `CONFIRMED` or `ACTIVE`, and it should surface constraint violations as a user-friendly "product is unavailable for that period" error.

`PENDING` bookings do not block availability in the database until the business confirms hold/expiration behavior. If pending holds should reserve inventory, the exclusion constraint status list must be updated.

## Indexing Decisions

Indexes support the main query patterns without indexing every column:

- User lookup and administration: unique `users.email`, `users(role, status)`, `users(status)`.
- Vendor review and filtering: `vendor_profiles(status)`, `vendor_profiles(verification_status)`, `vendor_profiles(lifecycle_stage)`.
- Subscriptions: `vendor_subscriptions(vendor_id, status)`, `vendor_subscriptions(status, ends_at)`.
- Product discovery and ownership: `products(vendor_id, status)`, `products(category_id, status)`, `products(status)`, `products(city)`, `products(pricing_model)`.
- Availability and bookings: `product_availability_periods(product_id, starts_at, ends_at)`, `bookings(product_id, starts_at, ends_at)`, `bookings(customer_id, status)`, `bookings(vendor_id, status)`, `bookings(status, starts_at)`.
- Payments and subscriptions: `payments(booking_id, status)`, `payments(vendor_subscription_id, status)`, `payments(status)`, unique `payments(provider, provider_reference)`.
- Notifications and reviews: `notifications(user_id, created_at)`, `notifications(user_id, read_at)`, `reviews(vendor_id, status)`.
- Messaging, disputes, and audit: participant, message timeline, dispute status, actor/time, resource, and action/time indexes.

## Deletion Strategy

Historical financial, booking, rental, subscription, review, dispute, and audit records use restrictive foreign keys. Users, vendors, products, and operational records should be deactivated, suspended, archived, or soft-deleted rather than physically deleted when historical records exist.

Product images/documents and conversation/dispute messages cascade only from their immediate parent records. Those cascades are acceptable because product deletion is restricted by historical booking records, and message containers are not financial records.

## Transaction Considerations

- Booking approval must run in a database transaction and rely on the exclusion constraint for final overlap safety.
- Payment confirmation must be idempotent and transactional with booking/rental state transitions.
- Vendor subscription renewal, upgrade, and downgrade must record a new subscription history row without deleting the previous row.
- Invoice creation should occur after successful booking payment and preserve snapshots of customer, vendor, product, and pricing data.
- Audit logs must avoid passwords, tokens, provider secrets, and other sensitive values in metadata.

## Subscription Data Usage

Phase 5 reuses the Phase 2 `subscription_plans` and `vendor_subscriptions` models without schema changes. Active subscription checks require `status = ACTIVE`, `starts_at <= now`, and `ends_at > now`; expired date ranges are not active and historical rows remain intact.

Plan limits are read from `subscription_plans`. Employee counting is currently a policy placeholder because employee membership models are not implemented yet.

## Product And Availability Data Usage

Phase 6 reuses the Phase 2 `categories`, `products`, `product_images`, `product_documents`, and `product_availability_periods` models without schema changes or a new migration.

Product deactivation uses `ProductStatus.ARCHIVED` and `archived_at` rather than physical deletion. Public product APIs read only `PUBLISHED` products. Product image and document tables store file metadata only and do not store binary file contents.

Vendor-managed availability currently supports `AVAILABLE`, `MAINTENANCE`, and `BLOCKED` periods. `RESERVED` remains reserved for the later booking workflow. The database-level valid-period check still protects `starts_at < ends_at`, and service validation rejects invalid date ranges before persistence.

## Seed Data

`prisma/seed.ts` creates non-sensitive development categories and example subscription plans only. It does not create real credentials or production users.

## Authentication Data

Phase 3 adds `refresh_sessions` and `email_verification_tokens` in migration `20260831100000_phase_3_authentication`.

- Refresh tokens are opaque credentials and are never stored in plaintext.
- Refresh sessions can be revoked individually and by token family for replay protection.
- Email verification tokens are stored as hashes and can be marked used when confirmed.
- Administrator accounts are not created through public registration endpoints.

## Decision Required

- Provide the complete original i-Share business specification and reconcile it against this schema.
- Confirm country, default currency, taxes, platform commission, deposits, refunds, payouts, and compliance requirements.
- Confirm exact vendor verification documents and retention policy.
- Confirm whether pending booking holds should block availability and how long they last.
- Confirm exact booking, payment, rental, subscription, cancellation, refund, late return, damage, and dispute state transitions.
- Confirm subscription grace period, proration, downgrade timing, cancellation-at-period-end behavior, and renewal automation.
- Confirm whether products require administrator listing approval before publishing.
- Confirm file storage provider, private document access rules, and evidence retention.
- Confirm notification channels, templates, delivery provider, and retry policy.
- Confirm final availability overlap semantics for combining available, blocked, maintenance, reserved, and future booking periods.
