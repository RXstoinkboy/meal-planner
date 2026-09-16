/**
 * Analytics facade — the only module importing PostHog. Swap PostHog for
 * another provider by rewriting this file; no call sites change.
 */
import { PostHog } from "posthog-react-native";
import type { Event } from "./events";

export { events } from "./events";
export type { Event };

// phc_… project write key is public-safe for client bundles
const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

export type EventProps = Record<string, string | number | boolean | null>;

let instance: PostHog | undefined;

function client(): PostHog | undefined {
	if (!key) return undefined;
	// ponytail: no-op without EXPO_PUBLIC_POSTHOG_KEY — local dev/tests stay clean
	instance ??= new PostHog(key, {
		host,
		captureAppLifecycleEvents: false, // manual capture only
	});
	return instance;
}

export function track(event: Event, props?: EventProps) {
	client()?.capture(event, props);
}

export function identify(userId: string) {
	client()?.identify(userId);
}

/** Call on logout so the next session gets a fresh anonymous distinct_id. */
export function reset() {
	client()?.reset();
}
