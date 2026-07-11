import { redirect } from "next/navigation";

// Rekalla opens like an app, not a website: straight to sign-up for new
// visitors. The middleware sends signed-in users to /dashboard instead.
export default function RootPage() {
  redirect("/signup");
}
