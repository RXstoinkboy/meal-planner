import { useObservable } from "@legendapp/state/react";
import { auth$ } from "@/state/auth";
import { AuthView } from "@/features/auth/components/auth_view";
import { ProfileView } from "@/features/auth/components/profile_view";

export default function Index() {
	const token = useObservable(auth$.token);

	return token ? <ProfileView /> : <AuthView />;
}
