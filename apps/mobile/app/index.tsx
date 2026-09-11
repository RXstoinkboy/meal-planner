import { useQuery, useMutation } from "@tanstack/react-query";
import { useObservable } from "@legendapp/state/react";
import { YStack, Text, Input, Button, Spinner } from "@/components";
import { useState } from "react";
import { api } from "@/lib/client";
import { auth$, setToken, clearToken } from "@/state/auth";

function fieldErrors(error: unknown): Record<string, string> {
	if (error && typeof error === "object" && "isValidationError" in error) {
		const e = error as {
			isValidationError(): boolean;
			response?: { errors?: { field: string; message: string }[] };
		};
		if (e.isValidationError() && e.response?.errors) {
			return Object.fromEntries(
				e.response.errors.map((err) => [err.field, err.message]),
			);
		}
	}
	return {};
}

function AuthView() {
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [form, setForm] = useState({
		fullName: "",
		email: "",
		password: "",
		passwordConfirmation: "",
	});

	const route =
		api.auth[mode === "login" ? "accessTokens" : "newAccount"].store;

	const mutation = useMutation(
		route.mutationOptions({
			onSuccess: (data) => {
				if (data.data.token) setToken(data.data.token);
			},
		}),
	);

	const errors = fieldErrors(mutation.error);

	return (
		<YStack grow={1} justify="center" p="$5" gap="$4">
			<Text fontSize="$8" fontWeight="bold">
				Meal Planner
			</Text>

			{mode === "signup" && (
				<Input
					placeholder="Full name"
					value={form.fullName}
					onChangeText={(v) => setForm({ ...form, fullName: v })}
					autoCapitalize="words"
				/>
			)}
			<Input
				placeholder="Email"
				value={form.email}
				onChangeText={(v) => setForm({ ...form, email: v })}
				autoCapitalize="none"
				keyboardType="email-address"
				textContentType="emailAddress"
			/>
			<Input
				placeholder="Password"
				value={form.password}
				onChangeText={(v) => setForm({ ...form, password: v })}
				secureTextEntry
			/>
			{mode === "signup" && (
				<Input
					placeholder="Confirm password"
					value={form.passwordConfirmation}
					onChangeText={(v) => setForm({ ...form, passwordConfirmation: v })}
					secureTextEntry
				/>
			)}

			{mutation.isError && Object.keys(errors).length === 0 && (
				<Text color="$color.red9">
					{String(mutation.error?.message ?? "Request failed")}
				</Text>
			)}
			{Object.entries(errors).map(([field, message]) => (
				<Text key={field} color="$color.red9">
					{message}
				</Text>
			))}

			<Button
				onPress={() => mutation.mutate({ body: form })}
				disabled={mutation.isPending}
			>
				{mutation.isPending ? (
					<Spinner />
				) : mode === "login" ? (
					"Log in"
				) : (
					"Sign up"
				)}
			</Button>
			<Button
				chromeless
				onPress={() => setMode(mode === "login" ? "signup" : "login")}
			>
				{mode === "login" ? "No account? Sign up" : "Have an account? Log in"}
			</Button>
		</YStack>
	);
}

function ProfileView() {
	const profile = useQuery(api.profile.profile.show.queryOptions());

	const logout = useMutation(
		api.profile.accessTokens.destroy.mutationOptions({
			onSettled: () => clearToken(),
		}),
	);

	if (profile.isLoading) {
		return (
			<YStack grow={1} justify="center" items="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	const user = profile.data?.data;

	return (
		<YStack grow={1} justify="center" items="center" gap="$4" p="$5">
			<Text fontSize="$8" fontWeight="bold">
				{user?.initials ?? "…"}
			</Text>
			<Text fontSize="$6">{user?.fullName ?? user?.email}</Text>
			<Text color="$color.gray9">{user?.email}</Text>

			<Button
				theme="red"
				onPress={() => logout.mutate({})}
				disabled={logout.isPending}
			>
				Log out
			</Button>
		</YStack>
	);
}

export default function Index() {
	const token = useObservable(auth$.token);

	return token ? <ProfileView /> : <AuthView />;
}
