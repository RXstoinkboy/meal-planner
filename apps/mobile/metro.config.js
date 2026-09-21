const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Sentry's wrapper around the Expo default config: adds debug IDs + source map
// upload hooks and swaps the RN SDK for its web build on web. Everything below
// is applied on top, unchanged.
const config = getSentryExpoConfig(projectRoot);

// Required for npm workspaces: let Metro find packages hoisted to repo root.
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(workspaceRoot, "node_modules"),
];

// Force key Tamagui packages to resolve to a single copy at the workspace root.
// Without this, duplicate instances break Tamagui's React Context (config not found).
const tamaguiSingletons = ["@tamagui/core", "@tamagui/web", "tamagui"];

config.resolver.extraNodeModules = tamaguiSingletons.reduce((acc, pkg) => {
	acc[pkg] = path.resolve(workspaceRoot, "node_modules", pkg);
	return acc;
}, {});

module.exports = config;
