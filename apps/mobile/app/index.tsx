import { useSelector } from "@legendapp/state/react";
import { auth$ } from "@/state/auth";
import { AuthView } from "@/features/auth/components/auth_view";
import { ProfileView } from "@/features/auth/components/profile_view";

export default function Index() {
	const user = useSelector(auth$.user);

	return user ? <ProfileView /> : <AuthView />;
}
