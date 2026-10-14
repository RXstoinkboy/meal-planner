import type { RecipeId, RecipeSourceType } from "./types";

export type RecipeIngredientDto = {
	rawText: string;
	name: string;
	quantity: string | null;
	unit: string | null;
	category: string | null;
	optional: boolean;
	position: number;
};

export type RecipeStepDto = {
	position: number;
	text: string;
	durationMinutes: number | null;
};

/** Mirrors the Nest mapper — no ingredient/step ids on the wire. */
export type RecipeDto = {
	id: number;
	title: string;
	description: string | null;
	servings: number;
	prepMinutes: number | null;
	cookMinutes: number | null;
	cuisine: string | null;
	notes: string | null;
	tags: string[];
	tools: string[];
	sourceType: RecipeSourceType;
	sourceUrl: string | null;
	minutes: number | null;
	ingredients: RecipeIngredientDto[];
	steps: RecipeStepDto[];
};

export type CreateRecipeIngredientDto = {
	name: string;
	rawText?: string;
	quantity?: number | null;
	unit?: string | null;
	category?: string | null;
	optional?: boolean;
};

export type CreateRecipeStepDto = {
	text: string;
	durationMinutes?: number | null;
};

/** Mirrors createRecipeSchema — title + servings + >=1 ingredient are required. */
export type CreateRecipeDto = {
	title: string;
	servings: number;
	description?: string | null;
	prepMinutes?: number | null;
	cookMinutes?: number | null;
	cuisine?: string | null;
	tags?: string[];
	tools?: string[];
	notes?: string | null;
	ingredients: CreateRecipeIngredientDto[];
	steps?: CreateRecipeStepDto[];
};

/** PATCH subset; the server rejects an empty one with 400. */
export type UpdateRecipeDto = Partial<CreateRecipeDto>;

/** What the update mutation takes: path id + patch body. */
export type UpdateRecipeVariables = UpdateRecipeDto & { id: RecipeId };
