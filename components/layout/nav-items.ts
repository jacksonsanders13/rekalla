import {
  House,
  BellRing,
  Sunrise,
  BookOpen,
  HeartPulse,
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

// v2: the assistant is the elder's home. The v1 self-care surfaces remain
// available as the assistant's data layer.
// NOTE (IA): this is now 7 tabs — above the ideal for 70+. A later pass should
// consolidate reminders/routine/vault/wellness under one "My day" surface.
const PATIENT_TABS: NavItem[] = [
  { href: "/assistant", label: "Rekalla", icon: MessagesSquare },
  { href: "/dashboard", label: "Summary", icon: House },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/routine", label: "Routine", icon: Sunrise },
  { href: "/vault", label: "Vault", icon: BookOpen },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
];

// Caregivers work through the people they care for.
const CAREGIVER_TABS: NavItem[] = [
  { href: "/caregiver", label: "People", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function tabsFor(accountType: AccountType): NavItem[] {
  return accountType === "caregiver" ? CAREGIVER_TABS : PATIENT_TABS;
}
