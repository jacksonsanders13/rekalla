import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors, font } from "../../lib/theme";

/** Bottom-tab icon size — larger than the platform default for easier reading. */
const TAB_ICON = 30;

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
        headerTitleStyle: { fontWeight: "700", fontSize: font.xl },
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("tab.account"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={TAB_ICON} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
