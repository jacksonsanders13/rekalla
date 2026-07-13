import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
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
          <Stack.Screen name="connect" options={{ title: "My caregivers" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="patient/[id]" options={{ title: "" }} />
        </Stack>
      </SessionProvider>
    </QueryClientProvider>
  );
}
