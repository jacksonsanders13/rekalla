import { Redirect } from "expo-router";
import { useSession } from "../lib/session";
import { Screen, Loading } from "../components/ui";

/** Entry gate: route to the right home for the signed-in role. */
export default function Index() {
  const { session, profile, loading } = useSession();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-up" />;
  }

  if (profile?.account_type === "caregiver") {
    return <Redirect href="/(caregiver)/people" />;
  }

  return <Redirect href="/(patient)/summary" />;
}
