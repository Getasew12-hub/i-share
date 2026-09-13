# API Design

## Versioning

All API routes use `/api/v1`.

## Implemented

### GET /api/v1/health

Purpose: confirm the backend is running.

Response:

```json
{
  "status": "ok",
  "service": "i-share-api"
}
```

### POST /api/v1/auth/register/customer

Purpose: create a customer account and customer profile.

Body: `email`, `password`, `displayName`, optional `firstName`, `lastName`, and `phoneNumber`.

Response: safe user payload and short-lived access token. A long-lived refresh credential is set as an HttpOnly cookie.

### POST /api/v1/auth/register/vendor

Purpose: create a vendor account and draft vendor profile.

Body: `email`, `password`, `displayName`, optional `firstName`, `lastName`, `phoneNumber`, `businessName`, `businessEmail`, and `businessPhone`.

Response: safe user payload and short-lived access token. Public administrator registration is not implemented.

### POST /api/v1/auth/login

Purpose: authenticate an active user with email and password.

Response: safe user payload and access token. Invalid credentials use a generic error and never reveal which field failed.

### POST /api/v1/auth/refresh

Purpose: rotate a valid refresh credential and issue a new access token.

Refresh credentials are stored only as hashes in the database, are revocable, and are rotated on every refresh. Reuse of a revoked refresh token revokes the whole token family.

### POST /api/v1/auth/logout

Purpose: revoke the current refresh session and clear the refresh cookie.

### GET /api/v1/auth/me

Purpose: return the current authenticated user from a Bearer access token.

### POST /api/v1/auth/email-verification/request

Purpose: create an email-verification token record for the authenticated user. Email delivery is not implemented until notification/provider decisions are approved.

### POST /api/v1/auth/email-verification/confirm

Purpose: mark a user email as verified when a valid verification token is presented.

### GET /api/v1/vendors/me/verification

Purpose: return the authenticated vendor's verification profile, required profile-completion state, review timestamps, rejection reason, and submitted document metadata.

Authorization: `VENDOR`.

### PUT /api/v1/vendors/me/profile

Purpose: update the authenticated vendor's own onboarding profile before approval.

Body: optional `displayName`, `businessName`, `businessEmail`, `businessPhone`, `taxIdentifier`, `description`, `websiteUrl`, `country`, `city`, `addressLine1`, and `addressLine2`.

Authorization: `VENDOR`.

### POST /api/v1/vendors/me/documents

Purpose: attach private verification document metadata to the authenticated vendor profile. This records metadata only; binary file storage/provider integration is still deferred.

Body: `fileName`, `storageKey`, `mimeType`, `fileSize`, optional `documentType`, `url`, and `metadata`.

Authorization: `VENDOR`.

### POST /api/v1/vendors/me/verification/submit

Purpose: submit a complete vendor profile for administrator review.

Rules: email must be verified, required business profile fields must be complete, pending submissions cannot be duplicated, approved vendors cannot resubmit, and rejected vendors may resubmit after correction.

Authorization: `VENDOR`.

### GET /api/v1/admin/vendors/pending

Purpose: list vendor profiles pending administrator verification review.

Authorization: `ADMIN`.

### GET /api/v1/admin/vendors/:vendorId

Purpose: return a vendor verification profile for administrator review.

Authorization: `ADMIN`.

### POST /api/v1/admin/vendors/:vendorId/approve

Purpose: approve a pending vendor verification submission.

Authorization: `ADMIN`.

### POST /api/v1/admin/vendors/:vendorId/reject

Purpose: reject a pending vendor verification submission with an administrator-visible reason that is also returned to the vendor.

Body: `reason`.

Authorization: `ADMIN`.

### GET /api/v1/subscriptions/plans

Purpose: list active subscription plans with monthly/yearly prices, limits, premium feature access, and analytics access.

Authorization: public.

### GET /api/v1/subscriptions/me

Purpose: return the authenticated vendor's current active subscription, if one exists, plus subscription history.

Authorization: `VENDOR`. The vendor profile is resolved from the authenticated user.

### POST /api/v1/subscriptions/me

Purpose: select an active subscription plan for the authenticated vendor when no active subscription exists.

Body: `planId`, `billingCycle`.

Authorization: `VENDOR`.

### PATCH /api/v1/subscriptions/me/plan

Purpose: change the authenticated vendor's active subscription plan or billing cycle by creating a new history row linked to the previous subscription.

Body: `planId`, optional `billingCycle`.

Authorization: `VENDOR`.

### POST /api/v1/subscriptions/me/cancel

Purpose: cancel the authenticated vendor's active subscription without deleting vendor, product, booking, rental, or historical subscription data.

Authorization: `VENDOR`.

## Planned Route Groups

### /api/v1/auth

Implemented responsibilities:

- Register
- Login
- Refresh token
- Logout
- Email verification

Planned later:

- Password reset
- Email delivery integration

Decision Required:

- Password reset workflow.
- Email provider and verification email template.

### /api/v1/users

Planned responsibilities:

- Current user profile
- User profile updates
- User status management where authorized

### /api/v1/vendors

Implemented responsibilities:

- Vendor profile management
- Vendor verification workflow

Planned later:

- File upload and signed URL integration for verification documents

### /api/v1/products

Implemented responsibilities:

- `GET /api/v1/products/categories`: list active categories.
- `GET /api/v1/products/public`: list published products for public browsing.
- `GET /api/v1/products/public/:productId`: view a published product.
- `GET /api/v1/products/me`: list the authenticated vendor's products.
- `POST /api/v1/products/me`: create a vendor product. Authorization: `VENDOR`.
- `GET /api/v1/products/me/:productId`: view an owned vendor product. Authorization: `VENDOR`.
- `PUT /api/v1/products/me/:productId`: update an owned vendor product. Authorization: `VENDOR`.
- `PATCH /api/v1/products/me/:productId/status`: change an owned product status among vendor-managed states. Authorization: `VENDOR`.
- `DELETE /api/v1/products/me/:productId`: deactivate/archive an owned product. Authorization: `VENDOR`.
- `POST /api/v1/products/me/:productId/images`: attach product image metadata. Authorization: `VENDOR`.
- `POST /api/v1/products/me/:productId/documents`: attach product document metadata. Authorization: `VENDOR`.
- `GET /api/v1/products/me/:productId/availability`: list owned product availability. Authorization: `VENDOR`.
- `POST /api/v1/products/me/:productId/availability`: create an owned product availability period. Authorization: `VENDOR`.
- `PUT /api/v1/products/me/:productId/availability/:availabilityId`: update an owned product availability period. Authorization: `VENDOR`.
- `DELETE /api/v1/products/me/:productId/availability/:availabilityId`: delete an owned product availability period. Authorization: `VENDOR`.

Product creation and updates validate category, description, pricing model/rates, currency, deposits, delivery charges, location, JSON metadata, and status. Product publishing requires approved vendor verification, an active subscription, and usage within subscription product limits.

Product media and document endpoints store metadata only: file name, storage key, URL when available, MIME type, size, visibility, and ordering/alt text for images. Binary upload and cloud object storage are deferred.

Public marketplace listing accepts `query` or `search`, `category`, `minPrice`, `maxPrice`, `location`, `availableOn`, `page`, `limit`, and `sort`. `category` may be a category slug or UUID. `sort` supports `newest`, `name_asc`, and `name_desc`. `limit` is capped at 50, `page` at 1000, and `maxPrice` must be greater than or equal to `minPrice`.

Public product responses exclude private ownership and storage data: vendor profile IDs, product metadata, product documents, image storage keys, and image metadata are only returned on authenticated vendor-owned product endpoints.

### /api/v1/categories

Implemented responsibilities:

- Public category listing through `GET /api/v1/products/categories`.

Planned later:

- Admin category management

### /api/v1/bookings

Planned responsibilities:

- Booking creation
- Booking details
- Booking status transitions
- Booking cancellation or modification if approved
- Rental lifecycle links

### /api/v1/payments

Planned responsibilities:

- Booking payment initiation
- Subscription payment initiation
- Payment status
- Provider webhooks

### /api/v1/reviews

Planned responsibilities:

- Create review for completed rental
- View product and vendor reviews
- Moderation if approved

### /api/v1/notifications

Planned responsibilities:

- List notifications
- Mark notification as read
- Notification preferences if approved

### /api/v1/subscriptions

Implemented responsibilities:

- List plans
- Subscribe vendor
- Subscription status
- Subscription cancellation
- Subscription plan changes
- Active-subscription and plan-access policy foundation

Planned later:

- Payment provider integration
- Renewal automation

### /api/v1/admin

Implemented responsibilities:

- Vendor verification queue and review actions

Planned later:

- Platform reporting
- Analytics
- Moderation
- Audit log access
- Administrative user and resource controls

## API Standards

- Validate request bodies, params, and query strings with Zod.
- Authenticate protected routes.
- Authorize protected routes by role and ownership.
- Never trust client-supplied ownership IDs.
- Return consistent errors.
- Use idempotency keys for payment and booking operations where retries are expected.
- Use database transactions for atomic workflows.

## Decision Required

- API response envelope format.
- Error code taxonomy.
- Advanced marketplace ranking and geospatial search behavior.
- File upload strategy.
- Webhook provider routes and signature validation rules.
