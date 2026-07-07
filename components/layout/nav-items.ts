import {
  Home,
  BellRing,
  Sunrise,
  BookOpen,
  HeartPulse,
  HeartHandshake,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/routine", label: "Routine", icon: Sunrise },
  { href: "/vault", label: "Memory Vault", icon: BookOpen },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/caregiver", label: "Caregivers", icon: HeartHandshake },
  { href: "/settings", label: "Settings", icon: Settings },
];
