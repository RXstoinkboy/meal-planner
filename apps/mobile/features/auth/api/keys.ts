/** Single source for auth cache keys; queries and invalidation must agree. */
export const authKeys = {
	all: ["auth"] as const,
	profile: () => [...authKeys.all, "profile"] as const,
};
