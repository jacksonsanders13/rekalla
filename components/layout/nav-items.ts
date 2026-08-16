import {
  Sun,
  Users,
  Settings,
  MessagesSquare,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import type { AccountType } from "@/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// v2 is a single-user product for the older adult: just THREE calm tabs.
// Rekalla (the assistant, the home) · My day (reminders/routine/vault/wellness,
// reached from one hub) · Profile. The granular self-care screens survive as
// the assistant's data layer and are reachable from /my-day.
const PATIENT_TABS: NavItem[] = [
  { href: "/assistant", label: "Rekalla", icon: MessagesSquare },
  { href: "/my-day", label: "My day", icon: Sun },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

// Caregivers work through the people they care for.
const CAREGIVER_TABS: NavItem[] = [
  { href: "/caregiver", label: "People", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function tabsFor(accountType: AccountType): NavItem[] {
  return accountType === "caregiver" ? CAREGIVER_TABS : PATIENT_TABS;
}
