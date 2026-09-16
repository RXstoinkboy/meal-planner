import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tamaguiConfig from "@/tamagui.config";
import { queryClient } from "@/lib/client";
import { hydrateAuth } from "@/state/auth";
import { useEffect } from "react";
import "@/lib/i18n";

const asyncStoragePersister = createAsyncStoragePersister({
	storage: AsyncStorage,
});

export default function RootLayout() {
	useEffect(() => {
		hydrateAuth();
	}, []);

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{ persister: asyncStoragePersister }}
		>
			<TamaguiProvider config={tamaguiConfig} defaultTheme="light">
				<StatusBar style="auto" />
				<Stack>
					<Stack.Screen name="index" />
				</Stack>
			</TamaguiProvider>
		</PersistQueryClientProvider>
	);
}
