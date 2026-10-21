import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/error";
import { env } from "@/lib/env";
import { auth$, clearSession, setUser, type AuthUser } from "@/state/auth";

export const queryClient = new QueryClient();

type RequestOptions = {
  method?: string;
  body?: unknown;
};

/** Shared 401 handling: one in-flight refresh, however many requests raced into it. */
let refreshing: Promise<boolean> | null = null;

async function refreshSession(user: AuthUser): Promise<boolean> {
  const response = await fetch(
    `${env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    },
  );

  if (!response.ok) return false;

  const session = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setUser({
    ...user,
    token: session.accessToken,
    refreshToken: session.refreshToken,
  });

  return true;
}

function refreshOnce(): Promise<boolean> {
  const user = auth$.user.peek();

  if (!user) {
    return Promise.resolve(false);
  }

  if (refreshing !== null) {
    return refreshing;
  }

  const pending = refreshSession(user)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });

  refreshing = pending;

  return pending;
}

/**
 * Plain-URL fetch wrapper; responses are bare bodies (no envelope). Non-2xx throws
 * ApiError so TanStack Query rejects. An expired access token is retried once after a
 * silent refresh; when the refresh token is dead too, the session is dropped.
 */
export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const response = await send(path, method, body);

  const hadSession = Boolean(auth$.user.peek());
  if (response.status !== 401 || !hadSession) {
    return parse<T>(response);
  }

  const refreshed = await refreshOnce();

  if (!refreshed) {
    clearSession();
    queryClient.clear();
    throw new ApiError(401, null);
  }

  return parse<T>(await send(path, method, body));
}

function send(path: string, method: string, body: unknown) {
  const user = auth$.user.peek();

  return fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as unknown;
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
