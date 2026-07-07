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

export const REMINDER_CATEGORIES: Record<ReminderCategory, CategoryMeta> = {
  medication: { label: "Medication", icon: Pill, tone: "clay" },
  meals: { label: "Meals", icon: UtensilsCrossed, tone: "honey" },
  appointments: { label: "Appointments", icon: CalendarClock, tone: "sky" },
  exercise: { label: "Exercise", icon: Footprints, tone: "sage" },
  family_calls: { label: "Family calls", icon: PhoneCall, tone: "plum" },
  custom: { label: "Personal", icon: Star, tone: "sand" },
};

export const VAULT_CATEGORIES: Record<VaultCategory, CategoryMeta> = {
  family: { label: "Family", icon: Users, tone: "plum" },
  contact: { label: "Contacts", icon: Contact, tone: "sky" },
  doctor: { label: "Doctors", icon: Stethoscope, tone: "sage" },
  medication: { label: "Medications", icon: Pill, tone: "clay" },
  important_date: { label: "Important dates", icon: CalendarHeart, tone: "honey" },
  emergency: { label: "Emergency", icon: Siren, tone: "clay" },
  note: { label: "Notes", icon: StickyNote, tone: "sand" },
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
