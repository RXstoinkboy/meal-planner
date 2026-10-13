import AsyncStorage from "@react-native-async-storage/async-storage";
import { observable } from "@legendapp/state";

const USER_KEY = "auth_user";

export type AuthUser = {
	userId: number;
	email: string;
	fullName: string | null;
};

export const auth$ = observable<{ user?: AuthUser }>();

let hydrated = false;

/** Load the persisted identity once at app boot. */
export async function hydrateAuth() {
	if (hydrated) return;
	hydrated = true;
	const stored = await AsyncStorage.getItem(USER_KEY);
	if (!stored) return;

	try {
		auth$.user.set(JSON.parse(stored) as AuthUser);
	} catch {
		// corrupted payload — drop it rather than boot into a broken session
		await AsyncStorage.removeItem(USER_KEY);
	}
}

export function setUser(user: AuthUser) {
	auth$.user.set(user);
	void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
	auth$.user.set(undefined);
	void AsyncStorage.removeItem(USER_KEY);
}
