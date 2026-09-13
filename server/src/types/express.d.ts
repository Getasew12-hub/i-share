import type { UserRole, UserStatus } from "@prisma/client";

export type AuthenticatedRequestUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  vendorProfileId?: string;
  customerProfileId?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}
