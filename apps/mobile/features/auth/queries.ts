import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { identify, reset } from "@/lib/analytics";
import { clearToken, setToken } from "@/state/auth";

/** Auth slice server state. All API calls go through the TanStack Query hooks here. */

export function useLogin() {
	return useMutation(
		api.auth.accessTokens.store.mutationOptions({
			onSuccess: (data) => {
				if (!data.data.token) return;
				setToken(data.data.token);
				if (data.data.user?.id) identify(String(data.data.user.id));
			},
		}),
	);
}

export function useSignup() {
	return useMutation(
		api.auth.newAccount.store.mutationOptions({
			onSuccess: (data) => {
				if (!data.data.token) return;
				setToken(data.data.token);
				if (data.data.user?.id) identify(String(data.data.user.id));
			},
		}),
	);
}

export function useProfile() {
	return useQuery(api.profile.profile.show.queryOptions());
}

export function useLogout() {
	return useMutation(
		api.profile.accessTokens.destroy.mutationOptions({
			onSettled: () => {
				clearToken();
				reset();
			},
		}),
	);
}
