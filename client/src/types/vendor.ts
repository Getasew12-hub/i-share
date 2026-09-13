export type VendorLifecycleStage =
  | "REGISTERED"
  | "EMAIL_VERIFICATION"
  | "BUSINESS_PROFILE"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED";

export type VendorVerificationStatus =
  "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export type VendorDocumentType =
  | "BUSINESS_LICENSE"
  | "TAX_CERTIFICATE"
  | "OWNER_ID"
  | "ADDRESS_PROOF"
  | "OTHER";

export type VendorDocument = {
  id: string;
  documentType: VendorDocumentType;
  reviewStatus: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  fileName: string;
  storageKey: string;
  url: string | null;
  mimeType: string;
  fileSize: number;
  submittedAt: string;
  reviewedAt: string | null;
};

export type VendorProfile = {
  id: string;
  userId: string;
  businessName: string | null;
  displayName: string;
  businessEmail: string | null;
  businessPhone: string | null;
  taxIdentifier: string | null;
  description: string | null;
  websiteUrl: string | null;
  country: string | null;
  city: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  lifecycleStage: VendorLifecycleStage;
  verificationStatus: VendorVerificationStatus;
  status: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  reviewedById: string | null;
  emailVerifiedAt: string | null;
  profileComplete: boolean;
  documents: VendorDocument[];
  createdAt: string;
  updatedAt: string;
};

export type VendorProfilePayload = Partial<{
  displayName: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  taxIdentifier: string;
  description: string;
  websiteUrl: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
}>;

export type VendorDocumentPayload = {
  documentType: VendorDocumentType;
  fileName: string;
  storageKey: string;
  url?: string;
  mimeType: string;
  fileSize: number;
};
