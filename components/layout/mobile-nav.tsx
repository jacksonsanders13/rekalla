"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { PRIMARY_NAV } from "./nav-items";

export function MobileHeader({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand-100 bg-sand-50/90 px-4 py-3 backdrop-blur lg:hidden">
      <Logo href="/dashboard" size="sm" />
      <Link
        href="/settings"
        aria-label="Settings and account"
        className="flex size-11 items-center justify-center rounded-full bg-sage-200 text-base font-semibold text-sage-800 transition-transform active:scale-95"
      >
        {initials(displayName)}
      </Link>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {PRIMARY_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors",
                  active ? "text-sage-700" : "text-sand-500 hover:text-sand-800",
                )}
              >
                <item.icon
                  className={cn("size-6", active && "text-sage-600")}
                  aria-hidden="true"
                />
                <span>{item.label === "Memory Vault" ? "Vault" : item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
