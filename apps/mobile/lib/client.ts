import { QueryClient } from "@tanstack/react-query";
import { createTuyau } from "@tuyau/core/client";
import { createTuyauReactQueryClient } from "@tuyau/react-query";
import { registry } from "@meal-planner/backend/registry";
import { auth$ } from "@/state/auth";
import { env } from "@/lib/env";

export const queryClient = new QueryClient();

export const client = createTuyau({
	baseUrl: env.EXPO_PUBLIC_API_URL,
	registry,
	headers: { Accept: "application/json" },
	hooks: {
		beforeRequest: [
			(request) => {
				const token = auth$.token.peek();
				if (token) {
					request.headers.set("Authorization", `Bearer ${token}`);
				}
			},
		],
	},
});

export const api = createTuyauReactQueryClient({ client });
