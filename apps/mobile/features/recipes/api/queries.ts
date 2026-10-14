import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";

import { queryClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";

import {
	createRecipe,
	deleteRecipe,
	fetchRecipe,
	fetchRecipes,
	updateRecipe,
} from "./api";
import type { CreateRecipeDto, RecipeDto, UpdateRecipeVariables } from "./dto";
import { recipeKeys } from "./keys";
import type { RecipeId } from "./types";

export function invalidateRecipeList() {
	queryClient.invalidateQueries({ queryKey: recipeKeys.list() });
}

export function invalidateRecipeDetail(id: RecipeId) {
	queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) });
}

type RecipeListOptions<TData> = Omit<
	UseQueryOptions<RecipeDto[], ApiError, TData>,
	"queryKey" | "queryFn"
>;

export function useRecipes<TData = RecipeDto[]>(
	options?: RecipeListOptions<TData>,
) {
	return useQuery({
		queryKey: recipeKeys.list(),
		queryFn: fetchRecipes,
		...options,
	});
}

type RecipeDetailOptions<TData> = Omit<
	UseQueryOptions<RecipeDto, ApiError, TData>,
	"queryKey" | "queryFn"
>;

export function useRecipe<TData = RecipeDto>(
	id: RecipeId,
	options?: RecipeDetailOptions<TData>,
) {
	return useQuery({
		queryKey: recipeKeys.detail(id),
		queryFn: () => fetchRecipe(id),
		...options,
	});
}

type CreateRecipeOptions<TContext> = Omit<
	UseMutationOptions<RecipeDto, ApiError, CreateRecipeDto, TContext>,
	"mutationFn"
>;

export function useCreateRecipe<TContext = unknown>(
	options?: CreateRecipeOptions<TContext>,
) {
	return useMutation({
		mutationFn: createRecipe,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			invalidateRecipeList();
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}

type UpdateRecipeOptions<TContext> = Omit<
	UseMutationOptions<RecipeDto, ApiError, UpdateRecipeVariables, TContext>,
	"mutationFn"
>;

export function useUpdateRecipe<TContext = unknown>(
	options?: UpdateRecipeOptions<TContext>,
) {
	return useMutation({
		mutationFn: updateRecipe,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			invalidateRecipeList();
			invalidateRecipeDetail(variables.id);
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}

type DeleteRecipeOptions<TContext> = Omit<
	UseMutationOptions<void, ApiError, RecipeId, TContext>,
	"mutationFn"
>;

export function useDeleteRecipe<TContext = unknown>(
	options?: DeleteRecipeOptions<TContext>,
) {
	return useMutation({
		mutationFn: deleteRecipe,
		...options,
		onSuccess: (data, variables, context, mutation) => {
			invalidateRecipeList();
			options?.onSuccess?.(data, variables, context, mutation);
		},
	});
}
