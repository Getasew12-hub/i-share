import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

type AuthRefreshResult = {
  accessToken: string;
};

type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<AuthRefreshResult>;
  onRefreshFailure: () => void;
};

export type AuthRequestConfig = AxiosRequestConfig & {
  _authRequest?: boolean;
  _authRetry?: boolean;
  skipAuth?: boolean;
};

let authHandlers: AuthHandlers | null = null;
let refreshPromise: Promise<AuthRefreshResult> | null = null;

export function configureAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export function refreshAuthSession() {
  if (!authHandlers) {
    return Promise.reject(new Error("Authentication handlers are not configured."));
  }

  refreshPromise ??= authHandlers.refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function authConfig(config: AxiosRequestConfig | undefined) {
  return (config ?? {}) as AuthRequestConfig;
}

function attachAccessToken(config: InternalAxiosRequestConfig) {
  const requestConfig = authConfig(config);

  if (requestConfig.skipAuth || !authHandlers) {
    return config;
  }

  if (requestConfig._authRetry) {
    return config;
  }

  requestConfig._authRequest = Boolean(config.headers.Authorization);
  const token = authHandlers.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    requestConfig._authRequest = true;
  } else if (config.headers.Authorization === "Bearer ") {
    delete config.headers.Authorization;
    requestConfig._authRequest = false;
  }

  return config;
}

async function refreshAndRetry(error: AxiosError) {
  const originalConfig = error.config;

  if (!originalConfig || error.response?.status !== 401 || !authHandlers) {
    throw error;
  }

  const requestConfig = authConfig(originalConfig);

  if (
    requestConfig.skipAuth ||
    !requestConfig._authRequest ||
    requestConfig._authRetry
  ) {
    throw error;
  }

  requestConfig._authRetry = true;

  try {
    const refreshed = await refreshAuthSession();

    originalConfig.headers = originalConfig.headers ?? {};
    originalConfig.headers.Authorization = `Bearer ${refreshed.accessToken}`;

    return apiClient.request(originalConfig);
  } catch (refreshError) {
    authHandlers.onRefreshFailure();
    throw refreshError;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1",
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(attachAccessToken);
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => refreshAndRetry(error),
);
