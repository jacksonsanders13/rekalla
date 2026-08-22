import { Home, CalendarDays, UserCircle, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// v3: single-user "bring your paper life online" — three calm tabs.
// Home (Scan + what's coming up) · Calendar · Profile.
export const TABS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
