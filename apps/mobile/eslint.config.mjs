// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import securityPlugin from "eslint-plugin-security";
import boundaries from "eslint-plugin-boundaries";

/**
 * Vertical slice boundaries. One feature = one `features/<slice>` folder, slices may
 * only reach into `shared` (lib/, components/) and global `state/`. Enforced, not on
 * paper — see .pi/skills/vertical-slices/SKILL.md.
 *
 * The `typescript` resolver is required: without it `@/features/x` stays unresolved,
 * is flagged as external and every rule below silently no-ops.
 */
const boundariesConfig = {
	name: "boundaries/vsa",
	files: ["**/*.ts", "**/*.tsx"],
	plugins: { boundaries },
	settings: {
		"import/resolver": {
			typescript: { project: "./tsconfig.json" },
			node: { extensions: [".js", ".jsx", ".ts", ".tsx", ".json"] },
		},
		"boundaries/elements": [
			// partialMatch: false anchors patterns at the app root, so a nested
			// `components/` inside a slice is NOT mistaken for shared UI.
			{ type: "route", pattern: "app", partialMatch: false },
			{
				type: "slice",
				pattern: "features/*",
				capture: ["slice"],
				partialMatch: false,
			},
			{ type: "shared", pattern: ["lib", "components"], partialMatch: false },
			{ type: "state", pattern: "state", partialMatch: false },
		],
		"boundaries/files": [
			{
				category: "test",
				pattern: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
			},
		],
	},
	rules: {
		"boundaries/dependencies": [
			2,
			{
				default: "disallow",
				policies: [
					// ponytail: files outside the taxonomy (metro.config.js, assets/**, tamagui.config.ts).
					// Dependencies *to* unknown files are ignored by the plugin already; only unknown
					// sources need this. Tighten when those files get descriptors.
					{
						from: { element: { isUnknown: true } },
						allow: { to: { element: { isUnknown: false } } },
					},
					// Tests may reach anywhere.
					{
						from: { file: { categories: "test" } },
						allow: { to: { element: { isUnknown: false } } },
					},
					// Route files compose slices and shared code.
					{
						from: { element: { type: "route" } },
						allow: {
							to: {
								element: { types: { anyOf: ["slice", "shared", "state"] } },
							},
						},
					},
					// A slice uses shared code, global state and its own files.
					// Intra-slice imports are skipped by the plugin (checkInternals defaults to false).
					{
						from: { element: { type: "slice" } },
						allow: {
							to: { element: { types: { anyOf: ["shared", "state"] } } },
						},
					},
					// Shared code and global state must never depend on a slice.
					{
						from: { element: { type: "shared" } },
						allow: {
							to: { element: { types: { anyOf: ["shared", "state"] } } },
						},
					},
					{
						from: { element: { type: "state" } },
						allow: {
							to: { element: { types: { anyOf: ["shared", "state"] } } },
						},
					},
				],
			},
		],
	},
};

export default defineConfig([
	expoConfig,
	securityPlugin.configs.recommended,
	{
		ignores: ["dist/*", "node_modules/*", ".expo/*", ".tamagui/*"],
	},
	boundariesConfig,
]);
