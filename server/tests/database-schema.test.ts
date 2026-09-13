import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schema = readFileSync(
  join(process.cwd(), "prisma", "schema.prisma"),
  "utf8",
);
const migration = readFileSync(
  join(
    process.cwd(),
    "prisma",
    "migrations",
    "20260830120000_phase_2_database_foundation",
    "migration.sql",
  ),
  "utf8",
);

describe("database schema foundation", () => {
  it("defines the core marketplace entities", () => {
    for (const modelName of [
      "User",
      "VendorProfile",
      "CustomerProfile",
      "SubscriptionPlan",
      "VendorSubscription",
      "Category",
      "Product",
      "ProductAvailabilityPeriod",
      "Booking",
      "Payment",
      "Invoice",
      "Rental",
      "DamageReport",
      "Review",
      "Notification",
      "Conversation",
      "Message",
      "Dispute",
      "AuditLog",
    ]) {
      expect(schema).toContain(`model ${modelName} `);
    }
  });

  it("keeps products, bookings, subscriptions, and reviews tied to their owners", () => {
    expect(schema).toContain(
      "vendor              VendorProfile               @relation(fields: [vendorId], references: [id], onDelete: Restrict)",
    );
    expect(schema).toContain(
      "customer     CustomerProfile @relation(fields: [customerId], references: [id], onDelete: Restrict)",
    );
    expect(schema).toContain(
      "vendor               VendorProfile        @relation(fields: [vendorId], references: [id], onDelete: Restrict)",
    );
    expect(schema).toContain("@@unique([customerId, rentalId])");
    expect(schema).toContain("@@index([vendorId, status])");
  });

  it("adds database-level constraints for overlap, date ranges, rating bounds, and foreign keys", () => {
    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    expect(migration).toContain('"bookings_no_overlapping_reserved_periods"');
    expect(migration).toContain('tstzrange("starts_at", "ends_at",');
    expect(migration).toContain("\"status\" IN ('CONFIRMED', 'ACTIVE')");
    expect(migration).toContain('"bookings_valid_period_chk"');
    expect(migration).toContain(
      '"product_availability_periods_valid_period_chk"',
    );
    expect(migration).toContain('"reviews_rating_range_chk"');
    expect(migration).toContain('"bookings_product_vendor_fkey"');
  });

  it("prevents reviews from targeting incomplete or mismatched rentals", () => {
    expect(migration).toContain("ensure_review_matches_completed_rental");
    expect(migration).toContain(
      "Reviews can only be created for completed rentals.",
    );
    expect(migration).toContain(
      "Review must match the completed rental customer, product, and vendor.",
    );
  });
});
