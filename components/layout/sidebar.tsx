"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-items";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-13 items-center gap-3.5 rounded-xl px-4 text-lg font-medium transition-colors",
        active
          ? "bg-sage-100 text-sage-900"
          : "text-sand-700 hover:bg-sand-100 hover:text-sand-950",
      )}
    >
      <item.icon
        className={cn("size-6", active ? "text-sage-700" : "text-sand-500")}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

export function Sidebar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-sand-100 bg-white/70 px-5 py-7 backdrop-blur lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lifted"
      >
        Skip to main content
      </a>
      <Logo href="/dashboard" className="px-2" />

      <nav aria-label="Primary" className="mt-9 flex flex-1 flex-col gap-1.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
        <div className="my-4 border-t border-sand-100" role="presentation" />
        {SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div className="border-t border-sand-100 pt-5">
        <div className="flex items-center gap-3 px-2">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage-200 text-base font-semibold text-sage-800"
          >
            {initials(displayName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-sand-950">
              {displayName}
            </p>
            <p className="truncate text-sm text-sand-500">{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-base font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-sand-950"
        >
          <LogOut className="size-5 text-sand-500" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
