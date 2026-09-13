-- Phase 4 vendor verification document metadata.
CREATE TYPE "VendorDocumentType" AS ENUM (
  'BUSINESS_LICENSE',
  'TAX_CERTIFICATE',
  'OWNER_ID',
  'ADDRESS_PROOF',
  'OTHER'
);

CREATE TYPE "VendorDocumentReviewStatus" AS ENUM (
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED'
);

ALTER TABLE "vendor_documents"
  ADD COLUMN "document_type" "VendorDocumentType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "review_status" "VendorDocumentReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(6);

CREATE INDEX "vendor_documents_review_status_idx" ON "vendor_documents"("review_status");
