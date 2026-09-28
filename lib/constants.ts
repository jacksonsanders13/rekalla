import {
  Pill,
  UtensilsCrossed,
  CalendarClock,
  Footprints,
  PhoneCall,
  Star,
  Users,
  Contact,
  Stethoscope,
  CalendarHeart,
  Siren,
  StickyNote,
  Sunrise,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import type {
  ReminderCategory,
  RoutinePeriod,
  VaultCategory,
} from "@/types/database";
import type { BadgeTone } from "@/components/ui/badge";

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  tone: BadgeTone;
}

/**
 * Look up a category's presentation, tolerating values this build has never
 * heard of.
 *
 * The maps below are typed `Record<ReminderCategory, …>`, so TypeScript treats
 * every lookup as total and never warns. The database disagrees: the enum lives
 * in Postgres and can gain values independently of this code. It already has.
 * The abandoned scan feature ran `alter type reminder_category add value` for
 * 'event' and 'bill', those values are still in the live enum and still on
 * rows, and reading `.icon` off the resulting undefined crashed the whole
 * reminders page rather than one row.
 *
 * Falling back is the right behaviour regardless of that history: an unknown
 * category should render as a plain reminder, not take the page down. The
 * mobile app has always done this. Keep every lookup going through here.
 */
function metaFor<K extends string>(
  map: Record<K, CategoryMeta>,
  key: string,
  fallback: K,
): CategoryMeta {
  return map[key as K] ?? map[fallback];
}

export function reminderCategoryMeta(category: string): CategoryMeta {
  return metaFor(REMINDER_CATEGORIES, category, "custom");
}

export function vaultCategoryMeta(category: string): CategoryMeta {
  return metaFor(VAULT_CATEGORIES, category, "note");
}

export const REMINDER_CATEGORIES: Record<ReminderCategory, CategoryMeta> = {
  medication: { label: "Medication", icon: Pill, tone: "pink" },
  meals: { label: "Meals", icon: UtensilsCrossed, tone: "orange" },
  appointments: { label: "Appointments", icon: CalendarClock, tone: "blue" },
  exercise: { label: "Exercise", icon: Footprints, tone: "green" },
  family_calls: { label: "Family calls", icon: PhoneCall, tone: "purple" },
  custom: { label: "Personal", icon: Star, tone: "teal" },
};

export const VAULT_CATEGORIES: Record<VaultCategory, CategoryMeta> = {
  family: { label: "Family", icon: Users, tone: "purple" },
  contact: { label: "Contacts", icon: Contact, tone: "blue" },
  doctor: { label: "Doctors", icon: Stethoscope, tone: "teal" },
  medication: { label: "Medications", icon: Pill, tone: "pink" },
  important_date: { label: "Important dates", icon: CalendarHeart, tone: "yellow" },
  emergency: { label: "Emergency", icon: Siren, tone: "red" },
  note: { label: "Notes", icon: StickyNote, tone: "gray" },
};

export const ROUTINE_PERIODS: Record<
  RoutinePeriod,
  { label: string; icon: LucideIcon; window: string }
> = {
  morning: { label: "Morning", icon: Sunrise, window: "6 AM – 12 PM" },
  afternoon: { label: "Afternoon", icon: Sun, window: "12 PM – 5 PM" },
  evening: { label: "Evening", icon: Moon, window: "5 PM – 10 PM" },
};

export const MOOD_SCALE = [
  { value: 1, label: "Very low", emoji: "😞" },
  { value: 2, label: "Low", emoji: "🙁" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😄" },
] as const;

export const ENERGY_SCALE = [
  { value: 1, label: "Exhausted" },
  { value: 2, label: "Tired" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Energetic" },
  { value: 5, label: "Full of energy" },
] as const;

/** Minutes a snoozed reminder waits before coming back. */
export const SNOOZE_MINUTES = 30;
