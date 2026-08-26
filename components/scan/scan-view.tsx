"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Images,
  Check,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  Receipt,
  Stethoscope,
} from "lucide-react";
import { fileToDataUrl, scanImage, type ScanItem } from "@/lib/scan";
import { useSaveScan } from "@/hooks/use-scans";
import { formatDay, formatTime } from "@/lib/format";

type Phase = "choose" | "scanning" | "review" | "saving";

export function ScanView({ userId }: { userId: string }) {
  const router = useRouter();
  const save = useSaveScan(userId);
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [docType, setDocType] = useState("other");
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    setFile(f);
    setPhase("scanning");
    try {
      const dataUrl = await fileToDataUrl(f);
      setPreview(dataUrl);
      const res = await scanImage(dataUrl);
      setDocType(res.doc_type);
      setItems(res.items);
      setPhase("review");
    } catch {
      setError("I couldn't read that one. Lay the page flat in good light and try again.");
      setPhase("choose");
    }
  }

  async function saveAll() {
    if (!file || items.length === 0) return;
    setPhase("saving");
    setError(null);
    try {
      await save.mutateAsync({ file, docType, items });
      router.push("/home");
    } catch {
      setError("Sorry, that didn't save. Please try again.");
      setPhase("review");
    }
  }

  return (
    <div className="space-y-6">
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <input ref={libRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-label">
          {phase === "review" ? "Here's what I found" : "Scan"}
        </h1>
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex size-11 items-center justify-center rounded-full text-label-2 hover:bg-white/10"
          aria-label="Close"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      {phase === "choose" && (
        <div className="space-y-4">
          <p className="text-xl leading-relaxed text-label-2">
            Take a photo of a paper calendar, an appointment card, or a bill.
            Rekalla will pull out the dates and remind you.
          </p>
          {error && <p className="text-lg font-semibold text-tint-red">{error}</p>}
          <BigButton onClick={() => camRef.current?.click()} primary>
            <Camera className="size-6" aria-hidden="true" /> Take a photo
          </BigButton>
          <BigButton onClick={() => libRef.current?.click()}>
            <Images className="size-6" aria-hidden="true" /> Choose a photo
          </BigButton>
        </div>
      )}

      {phase === "scanning" && (
        <div className="flex flex-col items-center gap-5 py-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="max-h-72 rounded-2xl object-contain" />}
          <Loader2 className="size-10 animate-spin text-accent" aria-hidden="true" />
          <p className="text-xl font-semibold text-label-2">Reading your paper…</p>
        </div>
      )}

      {(phase === "review" || phase === "saving") && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <>
              <p className="text-xl text-label-2">I didn&apos;t find any dates on that one.</p>
              <BigButton onClick={() => setPhase("choose")} primary>
                <Camera className="size-6" aria-hidden="true" /> Try another photo
              </BigButton>
            </>
          ) : (
            <>
              <p className="text-xl text-label-2">Check these before I save them.</p>
              {items.map((it, i) => (
                <div key={i} className="space-y-3 rounded-2xl bg-elev-1 p-4">
                  <div className="flex items-center gap-2.5 text-lg font-bold text-label">
                    <ItemIcon type={it.type} />
                    {formatDay(it.date)}
                    {it.time ? ` · ${formatTime(it.time)}` : ""}
                  </div>
                  <input
                    value={it.title}
                    onChange={(e) =>
                      setItems((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                    }
                    className="w-full rounded-xl bg-elev-2 px-4 py-3 text-xl text-label focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label="What is it?"
                  />
                  {it.location && <p className="text-lg text-label-2">{it.location}</p>}
                  {it.amount && <p className="text-lg text-label-2">Amount: {it.amount}</p>}
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    className="inline-flex items-center gap-2 rounded-xl bg-elev-2 px-4 py-2.5 text-lg font-semibold text-label hover:bg-elev-3"
                  >
                    <Trash2 className="size-5" aria-hidden="true" /> Remove
                  </button>
                </div>
              ))}
              {error && <p className="text-lg font-semibold text-tint-red">{error}</p>}
              <BigButton onClick={saveAll} primary disabled={phase === "saving"}>
                {phase === "saving" ? (
                  <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-6" aria-hidden="true" />
                )}
                {phase === "saving" ? "Adding…" : `Add ${items.length} to my calendar`}
              </BigButton>
              <BigButton onClick={() => setPhase("choose")}>
                <Camera className="size-6" aria-hidden="true" /> Start over
              </BigButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ItemIcon({ type }: { type: ScanItem["type"] }) {
  const cls = "size-6 text-accent";
  if (type === "bill") return <Receipt className={cls} aria-hidden="true" />;
  if (type === "appointment") return <Stethoscope className={cls} aria-hidden="true" />;
  return <CalendarDays className={cls} aria-hidden="true" />;
}

function BigButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl px-6 text-xl font-bold transition-all disabled:opacity-70 ${
        primary
          ? "bg-accent text-white hover:brightness-110"
          : "bg-elev-2 text-label hover:bg-elev-3"
      }`}
    >
      {children}
    </button>
  );
}
