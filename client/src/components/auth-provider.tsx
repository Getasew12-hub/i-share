import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext } from "../lib/auth-context";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  registerCustomer,
  registerVendor,
} from "../services/auth-service";
import type { AuthUser } from "../types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applyAuth = useCallback(
    (auth: { user: AuthUser; accessToken: string }) => {
      setUser(auth.user);
      setAccessToken(auth.accessToken);
    },
    [],
  );

  useEffect(() => {
    refreshSession()
      .then(applyAuth)
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [applyAuth]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isBootstrapping,
      async login(payload: { email: string; password: string }) {
        applyAuth(await loginRequest(payload));
      },
      async registerCustomer(payload: Parameters<typeof registerCustomer>[0]) {
        applyAuth(await registerCustomer(payload));
      },
      async registerVendor(payload: Parameters<typeof registerVendor>[0]) {
        applyAuth(await registerVendor(payload));
      },
      async logout() {
        await logoutRequest();
        setUser(null);
        setAccessToken(null);
      },
    }),
    [accessToken, applyAuth, isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
