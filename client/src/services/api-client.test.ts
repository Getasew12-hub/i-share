import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  apiClient,
  configureAuthHandlers,
  refreshAuthSession,
} from "./api-client";

function unauthorized(config: AxiosRequestConfig) {
  return new AxiosError(
    "Unauthorized",
    "ERR_BAD_REQUEST",
    config as InternalAxiosRequestConfig,
    undefined,
    {
      data: { error: { code: "ACCESS_TOKEN_EXPIRED" } },
      headers: {},
      status: 401,
      statusText: "Unauthorized",
      config: config as never,
    },
  );
}

afterEach(() => {
  configureAuthHandlers({
    getAccessToken: () => null,
    refreshAccessToken: async () => ({ accessToken: "unused" }),
    onRefreshFailure: vi.fn(),
  });
  vi.restoreAllMocks();
});

describe("authenticated API client", () => {
  it("shares one in-flight refresh request across callers", async () => {
    let resolveRefresh: ((result: { accessToken: string }) => void) | undefined;
    const refreshAccessToken = vi.fn(
      () =>
        new Promise<{ accessToken: string }>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    configureAuthHandlers({
      getAccessToken: () => "expired-token",
      refreshAccessToken,
      onRefreshFailure: vi.fn(),
    });

    const firstRefresh = refreshAuthSession();
    const secondRefresh = refreshAuthSession();

    expect(secondRefresh).toBe(firstRefresh);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);

    resolveRefresh?.({ accessToken: "refreshed-token" });
    await expect(firstRefresh).resolves.toEqual({
      accessToken: "refreshed-token",
    });
  });

  it("attaches the current access token to authenticated requests", async () => {
    const adapter = vi.fn(async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;
    configureAuthHandlers({
      getAccessToken: () => "access-token",
      refreshAccessToken: vi.fn(),
      onRefreshFailure: vi.fn(),
    });

    await apiClient.get("/protected");

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe(
      "Bearer access-token",
    );
  });

  it("does not invent a token when authentication is missing", async () => {
    const adapter = vi.fn(async (config) => {
      throw unauthorized(config);
    });
    const refreshAccessToken = vi.fn();
    apiClient.defaults.adapter = adapter;
    configureAuthHandlers({
      getAccessToken: () => null,
      refreshAccessToken,
      onRefreshFailure: vi.fn(),
    });

    await expect(apiClient.get("/protected")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes an expired token and retries the original request", async () => {
    const adapter = vi
      .fn()
      .mockImplementationOnce(async (config) => {
        throw unauthorized(config);
      })
      .mockImplementationOnce(async (config) => ({
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }));
    const refreshAccessToken = vi
      .fn()
      .mockResolvedValue({ accessToken: "refreshed-token" });
    apiClient.defaults.adapter = adapter;
    configureAuthHandlers({
      getAccessToken: () => "expired-token",
      refreshAccessToken,
      onRefreshFailure: vi.fn(),
    });

    await expect(apiClient.get("/protected")).resolves.toMatchObject({
      data: { ok: true },
    });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(adapter.mock.calls[1][0].headers.Authorization).toBe(
      "Bearer refreshed-token",
    );
  });

  it("clears authentication when refresh fails", async () => {
    const adapter = vi.fn(async (config) => {
      throw unauthorized(config);
    });
    const onRefreshFailure = vi.fn();
    const refreshAccessToken = vi
      .fn()
      .mockRejectedValue(new Error("refresh failed"));
    apiClient.defaults.adapter = adapter;
    configureAuthHandlers({
      getAccessToken: () => "expired-token",
      refreshAccessToken,
      onRefreshFailure,
    });

    await expect(apiClient.get("/protected")).rejects.toThrow(
      "refresh failed",
    );
    expect(onRefreshFailure).toHaveBeenCalledTimes(1);
  });

  it("does not refresh the same request more than once", async () => {
    const adapter = vi.fn(async (config) => {
      throw unauthorized(config);
    });
    const refreshAccessToken = vi
      .fn()
      .mockResolvedValue({ accessToken: "refreshed-token" });
    apiClient.defaults.adapter = adapter;
    configureAuthHandlers({
      getAccessToken: () => "expired-token",
      refreshAccessToken,
      onRefreshFailure: vi.fn(),
    });

    await expect(apiClient.get("/protected")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
  });
});