import { Redirect } from "expo-router";
import { useSession } from "../lib/session";
import { Screen, Loading } from "../components/ui";

/** Entry gate: route to the right home for the signed-in role. */
export default function Index() {
  const { session, loading } = useSession();

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

  // v3: Home (Scan + what's coming up) is the front door.
  return <Redirect href="/(patient)/home" />;
}
