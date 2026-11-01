import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
// first import: Sentry.init must run before anything else is loaded
import { wrapWithSentry } from "@/lib/sentry";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Epilogue_600SemiBold } from "@expo-google-fonts/epilogue/600SemiBold";
import { Epilogue_700Bold } from "@expo-google-fonts/epilogue/700Bold";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import tamaguiConfig, { APP_FONTS } from "@/tamagui.config";
import { queryClient } from "@/lib/api/client";
import { hydrateAuth } from "@/state/auth";
import { useEffect } from "react";
import "@/lib/i18n";

const asyncStoragePersister = createAsyncStoragePersister({
	storage: AsyncStorage,
});

const APP_FONT_LOAD_MAP = {
	[APP_FONTS.display]: Epilogue_700Bold,
	[APP_FONTS.heading]: Epilogue_600SemiBold,
	[APP_FONTS.body]: PlusJakartaSans_400Regular,
	[APP_FONTS.label]: PlusJakartaSans_600SemiBold,
	[APP_FONTS.overline]: PlusJakartaSans_700Bold,
};

// keep the splash up until fonts resolve; a failure must not strand it
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
	const [fontsLoaded, fontError] = useFonts(APP_FONT_LOAD_MAP);

	useEffect(() => {
		hydrateAuth();
	}, []);

	useEffect(() => {
		if (fontError) {
			console.warn("[fonts] falling back to system fonts", fontError);
		}
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) return null;

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{ persister: asyncStoragePersister }}
		>
			<TamaguiProvider config={tamaguiConfig} defaultTheme="light">
				<StatusBar style="dark" />
				<Stack>
					<Stack.Screen name="index" />
				</Stack>
			</TamaguiProvider>
		</PersistQueryClientProvider>
	);
}

export default wrapWithSentry(RootLayout);
