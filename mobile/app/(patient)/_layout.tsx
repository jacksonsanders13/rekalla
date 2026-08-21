import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { useT } from "../../lib/i18n";
import { colors, font } from "../../lib/theme";

/** Bottom-tab icon size — larger than the platform default for easier reading. */
const TAB_ICON = 30;

export default function PatientTabs() {
  const { session, loading } = useSession();
  const t = useT();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;

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
        name="assistant"
        options={{
          title: "Rekalla",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: "My day",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="sunny" size={TAB_ICON} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={TAB_ICON} color={color} />
          ),
        }}
      />
      {/* v2 single-user simplification: the granular screens stay routable
          (reached from My Day) but are hidden from the 3-tab bar. */}
      <Tabs.Screen name="summary" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="reminders" options={{ href: null, title: t("tab.reminders") }} />
      <Tabs.Screen name="routine" options={{ href: null, title: t("tab.routine") }} />
      <Tabs.Screen name="vault" options={{ href: null, title: t("tab.vault") }} />
      <Tabs.Screen name="wellness" options={{ href: null, title: t("tab.wellness") }} />
    </Tabs>
  );
}
