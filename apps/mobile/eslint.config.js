// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const securityPlugin = require("eslint-plugin-security");

module.exports = defineConfig([
	expoConfig,
	securityPlugin.configs.recommended,
	{
		ignores: ["dist/*", "node_modules/*", ".expo/*", ".tamagui/*"],
	},
]);
