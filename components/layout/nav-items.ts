import { Sun, MessagesSquare, UserCircle, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// v2 is a single-user product for the older adult: just THREE calm tabs.
// Rekalla (the assistant, the home) · My day (reminders/routine/vault/wellness,
// reached from one hub) · Profile. The granular self-care screens survive as
// the assistant's data layer and are reachable from /my-day.
export const TABS: NavItem[] = [
  { href: "/assistant", label: "Rekalla", icon: MessagesSquare },
  { href: "/my-day", label: "My day", icon: Sun },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
