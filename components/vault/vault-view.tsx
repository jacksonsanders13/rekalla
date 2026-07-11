"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarHeart,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { VAULT_CATEGORIES } from "@/lib/constants";
import { cn, fromDateKey } from "@/lib/utils";
import {
  useVaultItems,
  useSaveVaultItem,
  useDeleteVaultItem,
} from "@/hooks/use-vault";
import type { VaultItem } from "@/types";
import type { VaultCategory } from "@/types/database";
import type { VaultItemValues } from "@/lib/validations/vault";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { VaultForm } from "./vault-form";

type Filter = VaultCategory | "all";

function matchesSearch(item: VaultItem, query: string): boolean {
  const haystack = [item.title, item.subtitle, item.notes, item.phone, item.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function VaultView({ userId }: { userId: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VaultItem | undefined>();
  const [deleting, setDeleting] = useState<VaultItem | undefined>();

  const toast = useToast();
  const items = useVaultItems(userId);
  const saveItem = useSaveVaultItem(userId);
  const deleteItem = useDeleteVaultItem(userId);

  const visible = useMemo(() => {
    let list = items.data ?? [];
    if (filter !== "all") list = list.filter((item) => item.category === filter);
    if (query.trim()) list = list.filter((item) => matchesSearch(item, query.trim()));
    return list;
  }, [items.data, filter, query]);

  const counts = useMemo(() => {
    const map = new Map<VaultCategory, number>();
    for (const item of items.data ?? []) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, [items.data]);

  function handleSubmit(values: VaultItemValues) {
    saveItem.mutate(
      {
        id: editing?.id,
        values: {
          user_id: userId,
          category: values.category,
          title: values.title,
          subtitle: values.subtitle || null,
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          date_value: values.dateValue || null,
          notes: values.notes || null,
          is_pinned: values.isPinned,
        },
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditing(undefined);
          toast(editing ? "Entry updated." : "Added to your vault.");
        },
        onError: () => toast("Something went wrong. Please try again.", "error"),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Memory Vault"
        description="The people, medications, and details that matter — always here when you need them."
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="size-5" aria-hidden="true" />
            Add entry
          </Button>
        }
      />

      <div className="mb-6 space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-label-4"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search names, medications, notes…"
            aria-label="Search the memory vault"
            className="pl-12"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={cn(
              "min-h-11 rounded-full border px-4 text-base font-medium transition-colors",
              filter === "all"
                ? "border-white bg-white text-black"
                : "border-white/15 bg-elev-1 text-label-2 hover:border-white/25",
            )}
          >
            Everything ({items.data?.length ?? 0})
          </button>
          {(
            Object.entries(VAULT_CATEGORIES) as [
              VaultCategory,
              (typeof VAULT_CATEGORIES)[VaultCategory],
            ][]
          ).map(([value, meta]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(filter === value ? "all" : value)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-base font-medium transition-colors",
                filter === value
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-elev-1 text-label-2 hover:border-white/25",
              )}
            >
              <meta.icon className="size-4" aria-hidden="true" />
              {meta.label}
              {counts.get(value) ? ` (${counts.get(value)})` : ""}
            </button>
          ))}
        </div>
      </div>

      {items.isLoading ? (
        <CardSkeleton rows={4} />
      ) : (items.data ?? []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your vault is empty"
          description="Add family members, doctors, medications, and important dates so they're always one tap away."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-5" aria-hidden="true" />
              Add your first entry
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nothing matches"
          description="Try a different word, or clear the search and filters to see everything again."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {visible.map((item) => {
            const meta = VAULT_CATEGORIES[item.category];
            return (
              <li
                key={item.id}
                className="flex flex-col rounded-2xl bg-elev-1 p-6 transition-colors hover:bg-elev-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elev-2 text-label-3">
                      <meta.icon className="size-6" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-label">
                        {item.title}
                        {item.is_pinned && (
                          <Pin
                            className="ml-2 inline size-4 text-tint-orange"
                            aria-label="Pinned"
                          />
                        )}
                      </p>
                      {item.subtitle && (
                        <p className="text-base text-label-3">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="mt-4 flex-1 space-y-2.5">
                  {item.phone && (
                    <a
                      href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}
                      className="flex min-h-12 items-center gap-3 rounded-xl bg-white/10 px-4 text-lg font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <Phone className="size-5 text-white" aria-hidden="true" />
                      {item.phone}
                    </a>
                  )}
                  {item.email && (
                    <a
                      href={`mailto:${item.email}`}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-base text-label-2 transition-colors hover:bg-elev-2"
                    >
                      <Mail className="size-5 text-label-3" aria-hidden="true" />
                      <span className="truncate">{item.email}</span>
                    </a>
                  )}
                  {item.address && (
                    <p className="flex items-start gap-3 px-4 text-base text-label-2">
                      <MapPin
                        className="mt-1 size-5 shrink-0 text-label-3"
                        aria-hidden="true"
                      />
                      {item.address}
                    </p>
                  )}
                  {item.date_value && (
                    <p className="flex items-center gap-3 px-4 text-base text-label-2">
                      <CalendarHeart
                        className="size-5 shrink-0 text-label-3"
                        aria-hidden="true"
                      />
                      {fromDateKey(item.date_value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {item.notes && (
                    <p className="whitespace-pre-line px-4 pt-1 text-base leading-relaxed text-label-3">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-1 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                    className="flex size-11 items-center justify-center rounded-xl text-label-4 transition-colors hover:bg-elev-2 hover:text-label-2"
                  >
                    <Pencil className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => setDeleting(item)}
                    className="flex size-11 items-center justify-center rounded-xl text-label-4 transition-colors hover:bg-tint-red/10 hover:text-tint-red"
                  >
                    <Trash2 className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        title={editing ? "Edit entry" : "Add to your vault"}
      >
        {formOpen && (
          <VaultForm
            item={editing}
            initialCategory={filter === "all" ? "family" : filter}
            saving={saveItem.isPending}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditing(undefined);
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="Delete this entry?"
        description={
          deleting ? `"${deleting.title}" will be removed from your vault.` : undefined
        }
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={deleteItem.isPending}
            onClick={() =>
              deleting &&
              deleteItem.mutate(deleting.id, {
                onSuccess: () => {
                  setDeleting(undefined);
                  toast("Entry deleted.", "info");
                },
                onError: () =>
                  toast("Something went wrong. Please try again.", "error"),
              })
            }
          >
            Delete entry
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
