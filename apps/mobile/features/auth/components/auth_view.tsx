import { useState } from "react";
import { useTranslation } from "react-i18next";
import { YStack, Text, Input, Button, Spinner } from "@/components";
import { events, track } from "@/lib/analytics";
import { useLogin, useSignup } from "@/features/auth/queries";

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

export function AuthView() {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [form, setForm] = useState({
		fullName: "",
		email: "",
		password: "",
		passwordConfirmation: "",
	});

	const login = useLogin();
	const signup = useSignup();
	const mutation = mode === "login" ? login : signup;
	const errors = fieldErrors(mutation.error);

	return (
		<YStack grow={1} justify="center" p="$5" gap="$4">
			<Text fontSize="$8" fontWeight="bold">
				{t("app.name")}
			</Text>

			{mode === "signup" && (
				<Input
					placeholder={t("auth.fullName")}
					value={form.fullName}
					onChangeText={(v) => setForm({ ...form, fullName: v })}
					autoCapitalize="words"
				/>
			)}
			<Input
				placeholder={t("auth.email")}
				value={form.email}
				onChangeText={(v) => setForm({ ...form, email: v })}
				autoCapitalize="none"
				keyboardType="email-address"
				textContentType="emailAddress"
			/>
			<Input
				placeholder={t("auth.password")}
				value={form.password}
				onChangeText={(v) => setForm({ ...form, password: v })}
				secureTextEntry
			/>
			{mode === "signup" && (
				<Input
					placeholder={t("auth.confirmPassword")}
					value={form.passwordConfirmation}
					onChangeText={(v) => setForm({ ...form, passwordConfirmation: v })}
					secureTextEntry
				/>
			)}

			{mutation.isError && Object.keys(errors).length === 0 && (
				<Text color="$color.red9">
					{String(mutation.error?.message ?? t("auth.requestFailed"))}
				</Text>
			)}
			{Object.entries(errors).map(([field, message]) => (
				<Text key={field} color="$color.red9">
					{message}
				</Text>
			))}

			<Button
				onPress={() => {
					track(
						mode === "login"
							? events.auth.loginButtonClicked
							: events.auth.signupButtonClicked,
					);
					mutation.mutate({ body: form });
				}}
				disabled={mutation.isPending}
			>
				{mutation.isPending ? (
					<Spinner />
				) : mode === "login" ? (
					t("auth.login")
				) : (
					t("auth.signup")
				)}
			</Button>
			<Button
				chromeless
				onPress={() => setMode(mode === "login" ? "signup" : "login")}
			>
				{mode === "login"
					? t("auth.noAccountSignup")
					: t("auth.haveAccountLogin")}
			</Button>
		</YStack>
	);
}
