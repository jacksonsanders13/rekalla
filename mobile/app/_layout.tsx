import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "../lib/session";
import { I18nProvider } from "../lib/i18n";
import { TermsGate } from "../components/terms-gate";
import { WelcomeTour } from "../components/welcome-tour";
import { configureNotifications } from "../lib/notifications";
import { colors } from "../lib/theme";

export default function RootLayout() {
  const [termsResolved, setTermsResolved] = useState(false);

  useEffect(() => {
    configureNotifications();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.base },
            headerTintColor: colors.label,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.base },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(patient)" options={{ headerShown: false }} />
          <Stack.Screen name="(caregiver)" options={{ headerShown: false }} />
          <Stack.Screen name="connect" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="patient/[id]" options={{ title: "" }} />
        </Stack>
        <WelcomeTour enabled={termsResolved} />
        <TermsGate onResolved={() => setTermsResolved(true)} />
      </SessionProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
