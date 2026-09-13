# Requirements

## Source Status

The complete i-Share business specification file was not present in the workspace during initialization. This document captures only the requirements explicitly provided in the project initialization brief.

When the full specification is added, this document must be reconciled against it before implementation continues.

## Product

i-Share is a full-stack multi-vendor rental marketplace. It supports customers who rent items, vendors who list rentable products, and super administrators who operate and govern the platform.

## Roles

### Super Administrator

Confirmed responsibilities:

- Manage platform administration workflows.
- Review and verify vendors.
- Oversee subscriptions, listings, bookings, payments, reviews, notifications, reporting, analytics, RBAC, security, and auditing.
- Access administrative REST API areas under `/api/v1/admin`.

Decision Required:

- Exact administrator permissions.
- Whether additional admin roles exist.
- Vendor rejection, suspension, reinstatement, and appeal process.
- Administrative audit log retention and visibility rules.

### Vendor

Confirmed responsibilities:

- Register as a vendor.
- Complete verification before publishing rental products.
- Maintain an active subscription before creating new listings.
- Manage product listings.
- Manage product availability.
- Participate in booking, pickup, return, review, notification, and reporting workflows.
- Access only their own resources unless a documented admin workflow permits otherwise.

Decision Required:

- Vendor onboarding fields and document requirements.
- Verification criteria.
- Subscription plans, limits, billing cycle, grace period, and cancellation behavior.
- Listing approval requirements, if any.
- Vendor payout model.

### Customer

Confirmed responsibilities:

- Register before creating bookings.
- Search and filter rentable products.
- Create bookings for available products.
- Pay before a rental becomes active.
- Participate in pickup and return workflows.
- Review completed rentals.
- Access only their own resources unless a documented admin workflow permits otherwise.

Decision Required:

- Customer identity verification requirements.
- Booking cancellation rules.
- Late return, damage, refund, and dispute process.
- Customer notification preferences.

## Functional Areas

### Vendor Registration And Verification

- Vendors must be able to register.
- Verification is required before a vendor can publish rental products.
- Administrative review is required by implication, but the exact workflow is not specified.

### Vendor Subscriptions

- Vendors need an active subscription to create new listings.
- Subscription functionality must exist.
- Plan definitions, payment provider, limits, and lifecycle states are unspecified.

### Product Listings

- Vendors list rentable products.
- Product listings belong to vendors.
- Publishing must be restricted by vendor verification and subscription status.
- Listing fields, categories, images, deposits, inventory model, and approval status are unspecified.

### Product Availability

- Products need availability information.
- Availability must support booking conflict checks.
- The exact availability model is unspecified.

### Search And Filtering

- Customers must be able to search and filter products.
- Search parameters, ranking, geospatial behavior, category taxonomy, and sort options are unspecified.

### Booking

- Customers must be registered before creating bookings.
- Products cannot be booked for overlapping rental dates.
- Booking operations must be designed to prevent race conditions.
- Booking statuses and modification/cancellation rules are unspecified.

### Rental Duration And Pricing

- Rentals have duration-based pricing.
- Pricing calculation rules are unspecified.

### Payments

- Payment is required before a rental becomes active.
- Payment provider, escrow, refunds, deposits, vendor payouts, taxes, and fees are unspecified.

### Pickup And Return

- The marketplace must support pickup and return workflows.
- Confirmation steps, timestamps, penalties, and evidence capture are unspecified.

### Reviews And Ratings

- Only completed rentals can receive reviews.
- Review moderation, rating dimensions, edits, and vendor responses are unspecified.

### Notifications

- Notifications must support marketplace workflows.
- Channels, templates, delivery provider, retries, and user preferences are unspecified.

### Reporting And Analytics

- Reporting and analytics must exist.
- Metrics, dashboards, exports, and access rules are unspecified.

### RBAC

- The system must enforce role-based access control for super administrators, vendors, and customers.
- Authorization must be enforced on the backend.

### Security And Auditing

- Passwords must never be stored in plaintext.
- Secrets must not be exposed to the frontend.
- External input must be validated.
- Sensitive and business-critical actions should be auditable once auditing is implemented.

## Non-Functional Requirements

- Production-quality architecture.
- React, Vite, TypeScript frontend.
- Node.js, Express, TypeScript REST API backend.
- PostgreSQL database with Prisma ORM.
- Zod validation.
- ESLint and Prettier.
- Environment variables.
- Automated testing.
- Git version control.

## Decision Required

- Provide the complete business specification file.
- Confirm whether this marketplace handles physical goods only, services, spaces, vehicles, or all rentable asset types.
- Confirm country, currency, tax, and compliance requirements.
- Confirm identity, KYC, insurance, deposit, and damage liability requirements.
- Confirm exact payment provider and payout flow.
- Confirm whether real-time chat or messaging is required.
- Confirm file storage provider for product images, verification documents, and return evidence.
