import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors, font } from "../../lib/theme";

/** Bottom-tab icon size — larger than the platform default for easier reading. */
const TAB_ICON = 30;

export default function PatientTabs() {
  const { session, profile, loading } = useSession();
  const t = useT();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;
  if (!loading && profile?.account_type === "caregiver") {
    return <Redirect href="/(caregiver)/people" />;
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
        name="summary"
        options={{
          title: t("tab.summary"),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t("tab.reminders"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: t("tab.routine"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="sunny" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: t("tab.vault"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: t("tab.wellness"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={TAB_ICON} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
