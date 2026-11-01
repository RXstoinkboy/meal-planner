// Design tokens from docs/DESIGN.md. Light-only until a dark palette exists.
import { createV6Config, withTailwindTypeScale } from "@tamagui/config/v6";
import { createFont, createTamagui } from "tamagui";

// expo-font registers one style per family name, so each weight is its own family.
export const APP_FONTS = {
	body: "PlusJakartaSans_400Regular",
	label: "PlusJakartaSans_600SemiBold",
	overline: "PlusJakartaSans_700Bold",
	heading: "Epilogue_600SemiBold",
	display: "Epilogue_700Bold",
} as const;

// `background` is deliberately absent: a color token with that name would
// shadow the `background` theme key for every backgroundColor prop.
const PALETTE = {
	surface: "#faf9f6",
	"surface-dim": "#dbdad7",
	"surface-bright": "#faf9f6",
	"surface-container-lowest": "#ffffff",
	"surface-container-low": "#f4f3f0",
	"surface-container": "#efeeeb",
	"surface-container-high": "#e9e8e5",
	"surface-container-highest": "#e3e2e0",
	"surface-variant": "#e3e2e0",
	"on-surface": "#1a1c1a",
	"on-surface-variant": "#424843",
	"on-background": "#1a1c1a",
	"inverse-surface": "#2f312f",
	"inverse-on-surface": "#f2f1ee",
	"inverse-primary": "#b0ceb7",
	outline: "#737972",
	"outline-variant": "#c2c8c1",
	"surface-tint": "#4a6452",
	primary: "#274130",
	"on-primary": "#ffffff",
	"primary-container": "#3e5846",
	"on-primary-container": "#b0cdb6",
	"primary-fixed": "#ccead2",
	"primary-fixed-dim": "#b0ceb7",
	"on-primary-fixed": "#072012",
	"on-primary-fixed-variant": "#334c3b",
	secondary: "#9b4424",
	"on-secondary": "#ffffff",
	"secondary-container": "#fe906a",
	"on-secondary-container": "#75280a",
	"secondary-fixed": "#ffdbcf",
	"secondary-fixed-dim": "#ffb59c",
	"on-secondary-fixed": "#390c00",
	"on-secondary-fixed-variant": "#7c2d0f",
	tertiary: "#324014",
	"on-tertiary": "#ffffff",
	"tertiary-container": "#495729",
	"on-tertiary-container": "#bbcc93",
	"tertiary-fixed": "#d8eaae",
	"tertiary-fixed-dim": "#bccd94",
	"on-tertiary-fixed": "#151f00",
	"on-tertiary-fixed-variant": "#3e4c1f",
	error: "#ba1a1a",
	"on-error": "#ffffff",
	"error-container": "#ffdad6",
	"on-error-container": "#93000a",
} as const;

const lightTheme = {
	// white control/card surface so stock Button/Input/Card stay visible on the canvas
	background: "#ffffff",
	"background-hover": "#f4f3f0",
	"background-press": "#efeeeb",
	"background-focus": "#f4f3f0",
	"background-active": "#efeeeb",
	color: "#1a1c1a",
	"color-hover": "#1a1c1a",
	"color-press": "#1a1c1a",
	"color-focus": "#1a1c1a",
	"border-color": "#c2c8c1",
	"border-color-hover": "#737972",
	"border-color-press": "#424843",
	"border-color-focus": "#274130",
	"placeholder-color": "#737972",
	"outline-color": "#274130",
	"shadow-color": "rgba(30,37,32,0.08)",
	"accent-background": "#ccead2",
	"accent-color": "#072012",
	"color-1": "#ffffff",
	"color-2": "#faf9f6",
	"color-3": "#f4f3f0",
	"color-4": "#efeeeb",
	"color-5": "#e9e8e5",
	"color-6": "#e3e2e0",
	"color-7": "#dbdad7",
	"color-8": "#c2c8c1",
	"color-9": "#737972",
	"color-10": "#424843",
	"color-11": "#1a1c1a",
};

type SolidThemeInput = {
	background: string;
	backgroundHover: string;
	backgroundPress: string;
	foreground: string;
	placeholder: string;
	outline: string;
};

function solidTheme({
	background,
	backgroundHover,
	backgroundPress,
	foreground,
	placeholder,
	outline,
}: SolidThemeInput) {
	return {
		background,
		"background-hover": backgroundHover,
		"background-press": backgroundPress,
		"background-focus": backgroundHover,
		"background-active": backgroundPress,
		color: foreground,
		"color-hover": foreground,
		"color-press": foreground,
		"color-focus": foreground,
		"border-color": background,
		"border-color-hover": backgroundHover,
		"border-color-press": backgroundPress,
		"border-color-focus": background,
		"placeholder-color": placeholder,
		"outline-color": outline,
	};
}

const primaryTheme = solidTheme({
	background: "#274130",
	backgroundHover: "#3e5846",
	backgroundPress: "#274130",
	foreground: "#ffffff",
	placeholder: "#b0cdb6",
	outline: "#ffffff",
});

const themes = {
	light: lightTheme,
	light_primary: primaryTheme,
	light_secondary: solidTheme({
		background: "#9b4424",
		backgroundHover: "#7c2d0f",
		backgroundPress: "#390c00",
		foreground: "#ffffff",
		placeholder: "#ffdbcf",
		outline: "#ffffff",
	}),
	light_tertiary: solidTheme({
		background: "#324014",
		backgroundHover: "#495729",
		backgroundPress: "#324014",
		foreground: "#ffffff",
		placeholder: "#bbcc93",
		outline: "#ffffff",
	}),
	light_error: solidTheme({
		background: "#ba1a1a",
		backgroundHover: "#93000a",
		backgroundPress: "#93000a",
		foreground: "#ffffff",
		placeholder: "#ffdad6",
		outline: "#ffffff",
	}),
	// Checkbox/Switch/RadioGroup/ToggleGroup use this for their active state.
	light_brand: primaryTheme,
};

const TYPE_STYLES = {
	"display-hero": { size: 40, lineHeight: 48, letterSpacing: -0.8 },
	"display-hero-mobile": { size: 32, lineHeight: 38, letterSpacing: -0.48 },
	"headline-lg": { size: 28, lineHeight: 34, letterSpacing: -0.28 },
	"headline-md": { size: 22, lineHeight: 28, letterSpacing: -0.11 },
	"headline-sm": { size: 18, lineHeight: 24, letterSpacing: 0 },
	"body-lg": { size: 16, lineHeight: 24, letterSpacing: 0 },
	"body-md": { size: 14, lineHeight: 20, letterSpacing: 0 },
	"body-sm": { size: 12, lineHeight: 16, letterSpacing: 0 },
	"label-lg": { size: 14, lineHeight: 18, letterSpacing: 0.14 },
	"label-md": { size: 12, lineHeight: 16, letterSpacing: 0.24 },
	"label-sm": { size: 10, lineHeight: 14, letterSpacing: 0.4 },
} as const;

const scaleFor = <K extends "size" | "lineHeight" | "letterSpacing">(key: K) =>
	Object.fromEntries(
		Object.entries(TYPE_STYLES).map(([name, style]) => [name, style[key]]),
	);

// Every family shares the type scale; fontFamily picks the weight.
const makeFont = (family: string) =>
	withTailwindTypeScale(
		createFont({
			family,
			size: scaleFor("size"),
			lineHeight: scaleFor("lineHeight"),
			letterSpacing: scaleFor("letterSpacing"),
		}),
	);

const SPACE_TOKENS = {
	margin: 16,
	"margin-tablet": 32,
	"margin-desktop": 48,
	gutter: 16,
	"gutter-tablet": 24,
	"gutter-desktop": 32,
	"space-xs": 4,
	"space-sm": 8,
	"space-md": 16,
	"space-lg": 24,
	"space-xl": 40,
};

const SHADOW_TOKENS = {
	header: "0 1px 12px rgba(39,65,48,0.04)",
	dock: "0 12px 32px -6px rgba(62,88,70,0.16)",
	capture: "0 8px 20px -2px rgba(188,93,59,0.35)",
};

const baseConfig = createV6Config({ themes });

const tamaguiConfig = createTamagui({
	...baseConfig,
	fonts: {
		body: makeFont(APP_FONTS.body),
		label: makeFont(APP_FONTS.label),
		overline: makeFont(APP_FONTS.overline),
		heading: makeFont(APP_FONTS.heading),
		display: makeFont(APP_FONTS.display),
	},
	tokens: {
		...baseConfig.tokens,
		color: PALETTE,
		space: { ...baseConfig.tokens.space, ...SPACE_TOKENS },
		boxShadow: { ...baseConfig.tokens.boxShadow, ...SHADOW_TOKENS },
	},
	settings: {
		...baseConfig.settings,
		shouldAddPrefersColorThemes: false,
		fastSchemeChange: false,
	},
});

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
	interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig;
