import AsyncStorage from "@react-native-async-storage/async-storage";
import { observable } from "@legendapp/state";

import { reset } from "@/lib/analytics";
import { setSentryUser } from "@/lib/sentry";

const USER_KEY = "auth_user";

export type AuthUser = {
	userId: number;
	email: string;
	fullName: string | null;
	/** JWT sent as Bearer; refreshed silently when the API answers 401. */
	token: string;
	/** Opaque single-use token; exchanged for a new pair on refresh. */
	refreshToken: string;
};

export const auth$ = observable<{ user?: AuthUser }>();

let hydrated = false;

/** Load the persisted session once at app boot. */
export async function hydrateAuth() {
	if (hydrated) return;
	hydrated = true;
	const stored = await AsyncStorage.getItem(USER_KEY);
	if (!stored) return;

	try {
		const session = JSON.parse(stored) as Partial<AuthUser>;

		// Pre-token payloads cannot authenticate; drop them.
		if (!session.token || !session.refreshToken) {
			await AsyncStorage.removeItem(USER_KEY);
			return;
		}

		auth$.user.set(session as AuthUser);
	} catch {
		// corrupted payload — drop it rather than boot into a broken session
		await AsyncStorage.removeItem(USER_KEY);
	}
}

export function setUser(user: AuthUser) {
	auth$.user.set(user);
	void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Logout, and the fallback when a refresh fails: drops the session and resets analytics. */
export function clearSession() {
	auth$.user.set(undefined);
	void AsyncStorage.removeItem(USER_KEY);
	reset();
	setSentryUser(null);
}
