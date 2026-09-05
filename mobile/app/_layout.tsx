/**
 * The shell.
 *
 * Screens draw their own heading and their own Back control, so there is no
 * navigation bar here: one task on screen at a time, and nothing along the
 * top competing with it. There is no tab bar either. Home is a short list of
 * large destinations, which is easier to hit and easier to hold in mind than
 * five small icons.
 *
 * Screens from the earlier app are still in this folder and are no longer
 * reachable: nothing routes to them, and they go once this one is on
 * TestFlight.
 */
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import { PracticeProvider, usePractice } from "../lib/practice/context";
import { AuthProvider, useAuth } from "../lib/practice/auth";
import { configureNotificationHandler } from "../lib/practice/reminders";
import { colors } from "../lib/design/tokens";
import { useReduceMotion } from "../lib/design/motion";

/**
 * One catch-up backup a launch, for anything practised while the phone was
 * offline. It renders nothing and it cannot fail loudly: a copy that did not
 * go up is a copy that has not gone up yet.
 */
function BackupOnLaunch() {
  const { ready, backedUpTo, backUpQuietly } = usePractice();
  const { session } = useAuth();

  useEffect(() => {
    if (!ready || !backedUpTo || !session) return;
    void backUpQuietly();
    // Deliberately once a launch, not once a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, backedUpTo, session?.user.id]);

  return null;
}

function AppStack() {
  const reduceMotion = useReduceMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        // With Reduce Motion on there is no slide. Nothing is carried by the
        // transition, so nothing is lost by removing it.
        animation: reduceMotion ? "none" : "slide_from_right",
        gestureEnabled: !reduceMotion,
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  // Held until the face is ready, so no text renders in the system font and
  // then jumps to a different size under someone's eyes.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PracticeProvider>
          <StatusBar style="dark" />
          <AppStack />
          <BackupOnLaunch />
        </PracticeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
