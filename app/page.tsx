import { redirect } from "next/navigation";

// Rekalla opens like an app, not a website: straight to sign-up for new
// visitors. Signed-in visitors are sent on to Home.
export default function RootPage() {
  redirect("/signup");
}
