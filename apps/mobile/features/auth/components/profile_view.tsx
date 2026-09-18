import { useTranslation } from "react-i18next";
import { YStack, Text, Button, Spinner } from "@/components";
import { events, track } from "@/lib/analytics";
import { useLogout, useProfile } from "@/features/auth/queries";

export function ProfileView() {
	const { t } = useTranslation();
	const profile = useProfile();
	const logout = useLogout();

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
				onPress={() => {
					track(events.auth.logoutButtonClicked);
					logout.mutate({});
				}}
				disabled={logout.isPending}
			>
				{t("auth.logout")}
			</Button>
		</YStack>
	);
}
