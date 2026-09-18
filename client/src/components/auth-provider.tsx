import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AuthContext } from "../lib/auth-context";
import {
  configureAuthHandlers,
  refreshAuthSession,
} from "../services/api-client";
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
  const accessTokenRef = useRef<string | null>(null);

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setAccessToken(null);
  }, []);

  const applyAuth = useCallback(
    (auth: { user: AuthUser; accessToken: string }) => {
      setUser(auth.user);
      accessTokenRef.current = auth.accessToken;
      setAccessToken(auth.accessToken);
    },
    [],
  );

  useEffect(() => {
    configureAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken: async () => {
        const auth = await refreshSession();
        applyAuth(auth);
        return auth;
      },
      onRefreshFailure: clearAuth,
    });

    refreshAuthSession()
      .catch(clearAuth)
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [applyAuth, clearAuth]);

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
        clearAuth();
      },
    }),
    [accessToken, applyAuth, clearAuth, isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
