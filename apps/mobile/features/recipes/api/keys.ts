import type { RecipeId } from "./types";

/** Single source for recipe cache keys; queries and invalidation must agree. */
export const recipeKeys = {
	all: ["recipes"] as const,
	list: () => [...recipeKeys.all, "list"] as const,
	// route params arrive as strings, ids as numbers — one cache entry, not two
	detail: (id: RecipeId) => [...recipeKeys.all, "detail", String(id)] as const,
};
