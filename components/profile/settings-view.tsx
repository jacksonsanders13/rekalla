"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRIVACY_URL = "https://rekalla.app/privacy";
const TERMS_URL = "https://rekalla.app/terms";

export function SettingsView({
  userId,
  email,
  initialName,
  initialPhone,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: e } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq("id", userId);
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">Profile</h1>

      <div className="space-y-4 rounded-2xl bg-elev-1 p-5">
        <label className="block space-y-1.5">
          <span className="text-lg font-semibold text-label-2">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-elev-2 px-4 py-3 text-xl text-label focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-lg font-semibold text-label-2">Phone number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            className="w-full rounded-xl bg-elev-2 px-4 py-3 text-xl text-label focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <p className="text-lg text-label-3">Email: {email}</p>
        {error && <p className="text-lg font-semibold text-tint-red">{error}</p>}
        {saved && <p className="text-lg font-semibold text-tint-green">Saved.</p>}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-xl font-bold text-white shadow-[0_4px_20px_rgba(139,124,255,0.4)] hover:brightness-110 disabled:opacity-70"
        >
          <Check className="size-6" aria-hidden="true" /> {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-elev-1">
        <LegalRow href={PRIVACY_URL} label="Privacy Policy" />
        <LegalRow href={TERMS_URL} label="Terms of Use" />
      </div>

      <button
        type="button"
        onClick={signOut}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-elev-2 text-xl font-bold text-label hover:bg-elev-3"
      >
        <LogOut className="size-6" aria-hidden="true" /> Log out
      </button>
    </div>
  );
}

function LegalRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-[56px] items-center justify-between px-5 text-lg font-semibold text-label hover:bg-elev-2"
    >
      {label}
      <ExternalLink className="size-5 text-label-3" aria-hidden="true" />
    </a>
  );
}
