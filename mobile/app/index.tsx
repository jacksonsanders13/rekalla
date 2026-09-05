/**
 * Where the app opens.
 *
 * Someone who has been here before lands on Home. Someone who has not starts
 * at the welcome screen, and gets all the way through setting up and their
 * first practice without being asked to make an account.
 */
import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { usePractice } from "../lib/practice/context";
import { colors } from "../lib/design/tokens";

export default function Index() {
  const { ready, user } = usePractice();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/home" : "/welcome");
  }, [ready, user]);

  // A plain field of the app's own background, for the fraction of a second
  // before the answer is known. Nothing flashes, nothing spins.
  return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
}
