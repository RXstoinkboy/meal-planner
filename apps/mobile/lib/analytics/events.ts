/**
 * Event names keyed by vertical slice, mirroring the app structure
 * (app routes / state modules). Naming convention: "{slice}.{event_snake}".
 * Backend mirrors this file in apps/backend/app/services/events.ts.
 *
 * Slices can nest; every level exposes `base` and reuses the previous
 * level's base to derive its own:
 *
 *   const authPosts = `${authBase}.posts` as const;
 *   ...
 *   auth: {
 *     base: authBase,                  // "auth"
 *     signedUp: `${authBase}.signed_up`,
 *     posts: {
 *       base: authPosts,               // "auth.posts"
 *       created: `${authPosts}.created`,
 *     },
 *   },
 */
const authBase = "auth" as const;

export const events = {
	auth: {
		base: authBase,
		signedUp: `${authBase}.signed_up`,
		loggedIn: `${authBase}.logged_in`,
		loggedOut: `${authBase}.logged_out`,
	},
} as const;

type EvenValues<T> = {
	[K in keyof T]: K extends "base"
		? never
		: T[K] extends object
			? EvenValues<T[K]>
			: T[K];
}[keyof T];

/** Union of all leaf event names (base strings excluded). */
export type Event = Exclude<EvenValues<typeof events>, never>;
