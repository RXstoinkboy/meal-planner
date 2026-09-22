/** Analytics facade — only module importing PostHog; swapping providers means rewriting just this file. */
import { PostHog } from "posthog-react-native";
import type { Event } from "./events";

export { events } from "./events";
export type { Event };

// phc_… project write key is public-safe for client bundles
const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

// shared free-tier PostHog project — tag keeps insights filterable per app
const APP_TAG = "meal-planner";

export type EventProps = Record<string, string | number | boolean | null>;

let instance: PostHog | undefined;

function client(): PostHog | undefined {
	if (!key) return undefined;
	// ponytail: no-op without a key — keeps local dev/tests clean
	if (!instance) {
		instance = new PostHog(key, {
			host,
			captureAppLifecycleEvents: false, // manual capture only
		});
		void instance.register({ app: APP_TAG }); // super property → all events
	}
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
