import { useMutation, useQuery } from "@tanstack/react-query";

import { api, queryClient } from "@/lib/api/client";
import { identify, reset } from "@/lib/analytics";
import { setSentryUser } from "@/lib/sentry";
import { clearUser, setUser } from "@/state/auth";

export type UserResponse = { id: number; fullName: string | null; email: string; initials: string };

export type AuthForm = {
	email: string;
	fullName: string;
	password: string;
	passwordConfirmation: string;
};

/** Auth slice server state. All API calls go through the TanStack Query hooks here. */

function persistUser(user: UserResponse) {
	// drop anything cached for the previous identity before switching
	queryClient.clear();
	setUser({ userId: user.id, email: user.email, fullName: user.fullName });
	identify(String(user.id));
	setSentryUser(String(user.id));
}

export function useSignup() {
	return useMutation({
		mutationFn: (form: AuthForm) =>
			api<UserResponse>("/api/v1/auth/signup", { method: "POST", body: form }),
		onSuccess: persistUser,
	});
}

export function useLogin() {
	return useMutation({
		mutationFn: (form: AuthForm) =>
			api<UserResponse>("/api/v1/auth/login", {
				method: "POST",
				body: { email: form.email, password: form.password },
			}),
		onSuccess: persistUser,
	});
}

export function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: () => api<UserResponse>("/api/v1/account/profile"),
	});
}

/** There are no tokens to revoke — logging out is local state only. */
export function useLogout() {
	return useMutation({
		mutationFn: async () => {
			clearUser();
			queryClient.clear();
			reset();
			setSentryUser(null);
		},
	});
}
