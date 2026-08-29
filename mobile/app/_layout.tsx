import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import { SessionProvider } from "../lib/session";
import { I18nProvider, useT } from "../lib/i18n";
import { TermsGate } from "../components/terms-gate";
import { WelcomeTour } from "../components/welcome-tour";
import { configureNotifications } from "../lib/notifications";
import { colors, font, fonts } from "../lib/theme";

/**
 * Lives inside I18nProvider so the back-button label can be translated.
 * Without an explicit headerBackTitle, a pushed screen labels its back button
 * with the previous route's name — and for a route group that renders
 * literally as "(patient)", brackets and all.
 */
function AppStack() {
  const t = useT();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.base },
        headerTintColor: colors.label,
        headerTitleStyle: { fontFamily: fonts.bold, fontWeight: "700", fontSize: font.xl },
        contentStyle: { backgroundColor: colors.base },
        headerBackTitle: t("common.back"),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      <Stack.Screen name="(caregiver)" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="connect" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="patient/[id]" options={{ title: "" }} />
      <Stack.Screen name="profile-section" options={{ title: "" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [termsResolved, setTermsResolved] = useState(false);
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    configureNotifications();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  // Hold the first frame until the font is ready, so nothing renders in the
  // system face and then jumps.
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <AppStack />
        <WelcomeTour enabled={termsResolved} />
        <TermsGate onResolved={() => setTermsResolved(true)} />
      </SessionProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
