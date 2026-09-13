# Business Rules

The following rules are derived from the initialization brief only. The complete business specification file was not present during initialization.

## Access And Roles

BR-001: The system must support the roles Super Administrator, Vendor, and Customer.

BR-002: Backend authorization must enforce role-based access control.

BR-003: Vendors can access only their own resources unless an approved administrative workflow explicitly permits otherwise.

BR-004: Customers can access only their own resources unless an approved administrative workflow explicitly permits otherwise.

BR-005: Security-critical authorization must not exist only in the frontend.

## Vendor Rules

BR-006: Vendors must register before using vendor workflows.

BR-007: Only verified vendors can publish rental products.

BR-008: Vendors need an active subscription to create new listings.

BR-009: Vendor verification status must be controlled by authorized administrative workflows.

BR-009A: Vendors must verify their email and complete required business profile fields before submitting for administrator verification.

BR-009B: Only pending vendor verification submissions can be approved or rejected by administrators.

BR-009C: Rejected vendors may resubmit verification after correcting their profile.

## Product And Availability Rules

BR-010: Rental products must belong to a vendor.

BR-011: Product listings must support availability checks before booking.

BR-012: A product cannot be booked for overlapping rental dates.

BR-013: Booking overlap prevention must be enforced on the backend.

BR-014: Booking operations must be designed to prevent race conditions.

BR-014A: Vendors may create, view, update, deactivate, publish, and unpublish only their own products.

BR-014B: Product ownership must be derived from the authenticated vendor profile and must not trust client-supplied vendor IDs.

BR-014C: Product publishing requires an approved vendor, an active subscription, and product usage within the active subscription plan limit.

BR-014D: Public product APIs must expose only products with `PUBLISHED` status.

BR-014E: Product image and document APIs store metadata only; large binary files are not stored in PostgreSQL.

BR-014F: Availability periods must have a valid UTC date range where `startsAt` is before `endsAt`.

## Customer And Booking Rules

BR-015: Customers must be registered before creating bookings.

BR-016: Rental bookings must include a rental duration.

BR-017: Rental pricing must be based on rental duration according to rules that still need confirmation.

BR-018: Payment is required before a rental becomes active.

BR-019: Pickup and return must be tracked as part of the rental lifecycle.

BR-020: Only completed rentals can receive reviews.

## Payment And Subscription Rules

BR-021: Vendor subscriptions must have an active state that can be checked before listing creation.

BR-022: Customer rental payments must be associated with bookings.

BR-023: Payment-related changes must be auditable when auditing is implemented.

## Security And Data Rules

BR-024: All external input must be validated before it reaches business logic.

BR-025: Passwords must never be stored in plaintext.

BR-026: Secrets must never be exposed to the frontend.

BR-027: Sensitive data must not be returned from public API responses.

BR-028: Database transactions must be used when atomicity is required.

BR-029: Business rules that protect money, access, inventory, or booking state must be enforced server-side.

## Phase 3 Enforcement Notes

- Public registration is limited to `CUSTOMER` and `VENDOR`.
- Public `ADMIN` registration is not implemented.
- Authentication routes validate external input with Zod before service logic.
- Authentication responses return safe user payloads and never include password hashes.
- Refresh credentials are revocable and rotated server-side; replay detection revokes the refresh-token family.
- Role and owner middleware must be applied to future vendor/customer resource routes as those routes are implemented.

## Phase 4 Enforcement Notes

- Vendor verification routes are protected by backend authentication and `VENDOR` role checks.
- Admin vendor review routes are protected by backend authentication and `ADMIN` role checks.
- Vendor profile reads, updates, document metadata creation, and verification submission use the authenticated user's vendor profile instead of trusting client-supplied ownership IDs.
- Verification submission requires a verified email address and required business profile fields: display name, business name, business email, business phone, country, city, and address line 1.
- Pending submissions cannot be submitted again, approved vendors cannot resubmit through onboarding, and rejected vendors can resubmit after correction.
- Admin approval and rejection are limited to pending vendor submissions and create audit events where implemented.
- The approved-vendor authorization guard exists as a foundation for future product/listing workflows; those workflows are not implemented yet.

## Phase 5 Enforcement Notes

- Subscription plan listing returns active plans with monthly/yearly prices, product limits, employee limits, storage limits, active-booking limits, premium feature access, and analytics access.
- Vendor subscription routes are protected by backend authentication and `VENDOR` role checks.
- Subscription ownership is resolved from the authenticated user's vendor profile; subscription APIs do not accept or trust client-supplied vendor IDs.
- Expired subscription date ranges do not count as active even when historical records remain in the database.
- Creating, changing, and cancelling subscriptions does not delete products, bookings, rentals, vendor data, or subscription history.
- Reusable subscription policy helpers exist for active subscription, product limits, employee limits, active booking limits, premium features, and analytics access.
- Payment collection, provider webhooks, automatic renewal, and provider-specific subscription states are deferred to later payment phases.

## Phase 6 Enforcement Notes

- Product routes derive product ownership from the authenticated vendor user and never accept frontend-supplied `vendorId`.
- Customer accounts cannot use vendor product management routes because those routes require `VENDOR`.
- Product creation requires an active subscription and available product capacity from the existing subscription policy helper.
- Publishing reuses approved-vendor and subscription product-limit policy foundations; a draft already counted by the plan can be published when total usage is still within the plan limit.
- Vendor-managed status changes are limited to draft, published, unpublished, and archived transitions. Suspended and pending-review listing states remain reserved for future administrator approval workflows.
- Product deactivation archives the product instead of deleting historical marketplace data.
- Availability periods support available, maintenance, and blocked vendor-managed states. Reserved periods remain reserved for later booking workflows.
- Public product endpoints list and return only published products.
- Product image and document endpoints record storage metadata only; binary storage provider integration remains deferred.

## Phase 7 Enforcement Notes

- Public marketplace listing returns only products with `PUBLISHED` status.
- Marketplace search matches product name, product description, and category name.
- Category filters accept an active category slug or UUID.
- Price filters compare against the rate that matches each product's pricing model.
- Available-date filtering requires an available period covering the requested date and excludes products blocked, reserved, or under maintenance during that same time.
- Public marketplace responses omit vendor profile IDs, product metadata, product documents, image storage keys, and image metadata.
- Marketplace query parameters are validated before service logic, including sort allow-listing, positive pagination, page/limit caps, valid dates, and valid price ranges.

## Decision Required

- Confirm final access-token and refresh-token lifetimes.
- Confirm email provider, verification email template, and password reset workflow.
- Exact booking statuses and allowed transitions.
- Exact subscription statuses and allowed transitions.
- Exact subscription grace period, proration, downgrade timing, renewal behavior, and cancellation-at-period-end behavior.
- Exact payment statuses and provider webhook rules.
- Exact cancellation, refund, deposit, late return, damage, and dispute rules.
- Exact review moderation rules.
- Exact notification triggers and channels.
- Exact reporting and analytics metrics.
- Confirm whether products require administrator listing approval before publishing.
- Confirm exact product category taxonomy and required listing fields beyond the database foundation.
- Confirm file storage provider and public/private access rules for product media and documents.
- Confirm whether availability periods may overlap and how bookings should combine available, blocked, maintenance, and reserved periods.
