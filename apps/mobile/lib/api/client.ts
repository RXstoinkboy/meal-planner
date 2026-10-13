import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/error";
import { env } from "@/lib/env";
import { auth$ } from "@/state/auth";

export const queryClient = new QueryClient();

type RequestOptions = {
	method?: string;
	body?: unknown;
};

/**
 * Plain-URL fetch wrapper; responses are bare bodies (no envelope). Non-2xx throws
 * ApiError so TanStack Query rejects.
 */
export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", body } = options;
	const user = auth$.user.peek();

	const response = await fetch(`${env.EXPO_PUBLIC_API_URL}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...(user ? { "x-user-id": String(user.userId) } : {}),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const isOk = response.ok;

	if (!isOk) {
		const errorBody = (await response.json().catch(() => null)) as unknown;
		throw new ApiError(response.status, errorBody);
	}

	if (response.status === 204) return undefined as T;

	return (await response.json()) as T;
}
