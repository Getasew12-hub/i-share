import { createContext } from "react";

import type {
  registerCustomer,
  registerVendor,
} from "../services/auth-service";
import type { AuthUser } from "../types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  login(payload: { email: string; password: string }): Promise<void>;
  registerCustomer(
    payload: Parameters<typeof registerCustomer>[0],
  ): Promise<void>;
  registerVendor(payload: Parameters<typeof registerVendor>[0]): Promise<void>;
  logout(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
