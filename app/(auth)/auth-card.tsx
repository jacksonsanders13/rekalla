import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-sand-100 bg-white p-8 shadow-soft sm:p-10">
      <h1 className="font-display text-3xl font-medium text-sand-950">
        {title}
      </h1>
      <p className="mt-2 text-base text-sand-600">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-clay-100 bg-clay-50 px-4 py-3.5"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-clay-600" aria-hidden="true" />
      <p className="text-base font-medium text-clay-700">{message}</p>
    </div>
  );
}
