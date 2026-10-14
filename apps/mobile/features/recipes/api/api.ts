import { api } from "@/lib/api/client";

import type { CreateRecipeDto, RecipeDto, UpdateRecipeVariables } from "./dto";
import type { RecipeId } from "./types";

export function fetchRecipes() {
	return api<RecipeDto[]>("/api/v1/recipes");
}

export function fetchRecipe(id: RecipeId) {
	return api<RecipeDto>(`/api/v1/recipes/${id}`);
}

export function createRecipe(input: CreateRecipeDto) {
	return api<RecipeDto>("/api/v1/recipes", { method: "POST", body: input });
}

export function updateRecipe({ id, ...patch }: UpdateRecipeVariables) {
	return api<RecipeDto>(`/api/v1/recipes/${id}`, {
		method: "PATCH",
		body: patch,
	});
}

export function deleteRecipe(id: RecipeId) {
	return api<void>(`/api/v1/recipes/${id}`, { method: "DELETE" });
}
