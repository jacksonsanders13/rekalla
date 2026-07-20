import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors } from "../../lib/theme";

export default function CaregiverTabs() {
  const { session, profile, loading } = useSession();
  const t = useT();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;
  if (!loading && profile && profile.account_type !== "caregiver") {
    return <Redirect href="/(patient)/summary" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.base },
        headerTintColor: colors.label,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.base,
          borderTopColor: "rgba(255,255,255,0.12)",
        },
        tabBarActiveTintColor: colors.label,
        tabBarInactiveTintColor: colors.label3,
        sceneStyle: { backgroundColor: colors.base },
      }}
    >
      <Tabs.Screen
        name="people"
        options={{
          title: t("tab.people"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("tab.account"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
