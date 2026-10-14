import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";

import { queryClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { identify, reset } from "@/lib/analytics";
import { setSentryUser } from "@/lib/sentry";
import { clearUser, setUser } from "@/state/auth";

import { fetchProfile, login, signup } from "./api";
import type { LoginDto, SignupDto, UserDto } from "./dto";
import { authKeys } from "./keys";

/** Auth slice server state. All API calls go through the TanStack Query hooks here. */

function persistUser(user: UserDto) {
	// drop anything cached for the previous identity before switching
	queryClient.clear();
	setUser({ userId: user.id, email: user.email, fullName: user.fullName });
	identify(String(user.id));
	setSentryUser(String(user.id));
}

type SignupOptions<TContext> = Omit<
	UseMutationOptions<UserDto, ApiError, SignupDto, TContext>,
	"mutationFn"
>;

export function useSignup<TContext = unknown>(
	options?: SignupOptions<TContext>,
) {
	return useMutation({
		mutationFn: signup,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			persistUser(data);
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}

type LoginOptions<TContext> = Omit<
	UseMutationOptions<UserDto, ApiError, LoginDto, TContext>,
	"mutationFn"
>;

export function useLogin<TContext = unknown>(options?: LoginOptions<TContext>) {
	return useMutation({
		mutationFn: login,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			persistUser(data);
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

/** There are no tokens to revoke — logging out is local state only. */
export function useLogout<TContext = unknown>(
	options?: LogoutOptions<TContext>,
) {
	return useMutation({
		mutationFn: async () => {
			clearUser();
			queryClient.clear();
			reset();
			setSentryUser(null);
		},
		...options,
	});
}
