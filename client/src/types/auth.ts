export type UserRole = "ADMIN" | "VENDOR" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  vendorProfileId?: string;
  customerProfileId?: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};
