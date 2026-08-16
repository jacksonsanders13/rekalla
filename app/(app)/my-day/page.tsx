import type { Metadata } from "next";
import Link from "next/link";
import { Sunrise, BellRing, ListChecks, BookOpen, HeartPulse, ChevronRight } from "lucide-react";
import { requirePatient } from "@/lib/session";

export const metadata: Metadata = { title: "My day" };

// v2 hub: one calm screen linking to the self-care surfaces, so the elder sees
// only three tabs. Every link is a large, keyboard-focusable target.
const LINKS = [
  { href: "/dashboard", label: "Today at a glance", Icon: Sunrise },
  { href: "/reminders", label: "My reminders", Icon: BellRing },
  { href: "/routine", label: "My routine", Icon: ListChecks },
  { href: "/vault", label: "My photos & notes", Icon: BookOpen },
  { href: "/wellness", label: "How I'm feeling", Icon: HeartPulse },
];

export default async function MyDayPage() {
  await requirePatient();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">My day</h1>
      <p className="text-xl leading-relaxed text-label">
        Everything about your day, in one place.
      </p>
      <ul className="space-y-3">
        {LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[72px] items-center gap-4 rounded-2xl bg-elev-1 p-4 text-xl font-semibold text-label hover:bg-elev-2 focus:outline-none focus:ring-[3px] focus:ring-white/25"
            >
              <Icon className="size-7 shrink-0 text-label-2" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-6 text-label-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
