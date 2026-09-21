import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
// first import: Sentry.init must run before anything else is loaded
import { wrapWithSentry } from "@/lib/sentry";
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

function RootLayout() {
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

export default wrapWithSentry(RootLayout);
