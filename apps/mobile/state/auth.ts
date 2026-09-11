import AsyncStorage from "@react-native-async-storage/async-storage";
import { observable } from "@legendapp/state";

const TOKEN_KEY = "auth_token";

export const auth$ = observable<{ token?: string }>();

let hydrated = false;

/** Load persisted token once at app boot. */
export async function hydrateAuth() {
	if (hydrated) return;
	hydrated = true;
	const token = await AsyncStorage.getItem(TOKEN_KEY);
	if (token) auth$.token.set(token);
}

export function setToken(token: string) {
	auth$.token.set(token);
	AsyncStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
	auth$.token.set(undefined);
	AsyncStorage.removeItem(TOKEN_KEY);
}
