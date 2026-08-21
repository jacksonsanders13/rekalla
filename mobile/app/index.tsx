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

  // v2 single-user product: everyone is the older adult; the assistant is home.
  return <Redirect href="/(patient)/assistant" />;
}
