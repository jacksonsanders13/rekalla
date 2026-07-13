import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

export default function PatientTabs() {
  const { session, profile, loading } = useSession();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;
  if (!loading && profile?.account_type === "caregiver") {
    return <Redirect href="/(caregiver)/people" />;
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
        name="summary"
        options={{
          title: "Summary",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: "Routine",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: "Wellness",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
