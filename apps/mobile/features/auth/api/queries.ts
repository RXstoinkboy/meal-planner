import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";

import { queryClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { identify } from "@/lib/analytics";
import { setSentryUser } from "@/lib/sentry";
import { auth$, clearSession, setUser } from "@/state/auth";

import { fetchProfile, login, logout, signup } from "./api";
import type { LoginDto, SessionDto, SignupDto, UserDto } from "./dto";
import { authKeys } from "./keys";

/** Auth slice server state. All API calls go through the TanStack Query hooks here. */

function persistSession(session: SessionDto) {
	// drop anything cached for the previous identity before switching
	queryClient.clear();
	setUser({
		userId: session.user.id,
		email: session.user.email,
		fullName: session.user.fullName,
		token: session.accessToken,
		refreshToken: session.refreshToken,
	});
	identify(String(session.user.id));
	setSentryUser(String(session.user.id));
}

type SignupOptions<TContext> = Omit<
	UseMutationOptions<SessionDto, ApiError, SignupDto, TContext>,
	"mutationFn"
>;

export function useSignup<TContext = unknown>(
	options?: SignupOptions<TContext>,
) {
	return useMutation({
		mutationFn: signup,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			persistSession(data);
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}

type LoginOptions<TContext> = Omit<
	UseMutationOptions<SessionDto, ApiError, LoginDto, TContext>,
	"mutationFn"
>;

export function useLogin<TContext = unknown>(options?: LoginOptions<TContext>) {
	return useMutation({
		mutationFn: login,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			persistSession(data);
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}

type ProfileOptions<TData> = Omit<
	UseQueryOptions<UserDto, ApiError, TData>,
	"queryKey" | "queryFn"
>;

export function useProfile<TData = UserDto>(options?: ProfileOptions<TData>) {
	return useQuery({
		queryKey: authKeys.profile(),
		queryFn: fetchProfile,
		...options,
	});
}

type LogoutOptions<TContext> = Omit<
	UseMutationOptions<void, ApiError, void, TContext>,
	"mutationFn"
>;

/** Server-side revocation first (best effort); the local session goes either way. */
export function useLogout<TContext = unknown>(
	options?: LogoutOptions<TContext>,
) {
	return useMutation({
		mutationFn: async () => {
			const user = auth$.user.peek();

			if (user) {
				await logout(user.refreshToken).catch(() => undefined);
			}

			clearSession();
			queryClient.clear();
		},
		...options,
	});
}
