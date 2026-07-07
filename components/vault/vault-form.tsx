"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VAULT_CATEGORIES } from "@/lib/constants";
import { vaultItemSchema, type VaultItemValues } from "@/lib/validations/vault";
import type { VaultItem } from "@/types";
import type { VaultCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";

const SUBTITLE_LABEL: Record<VaultCategory, string> = {
  family: "Relationship (e.g. Daughter)",
  contact: "Who they are (e.g. Pharmacist)",
  doctor: "Specialty (e.g. Primary care)",
  medication: "Dosage (e.g. 10 mg every morning)",
  important_date: "What it's for (e.g. With Eduardo)",
  emergency: "Who they are (e.g. Neighbor with spare key)",
  note: "Short summary (optional)",
};

const isPerson = (category: VaultCategory) =>
  ["family", "contact", "doctor", "emergency"].includes(category);

export function VaultForm({
  item,
  initialCategory = "family",
  saving,
  onSubmit,
  onCancel,
}: {
  item?: VaultItem;
  initialCategory?: VaultCategory;
  saving: boolean;
  onSubmit: (values: VaultItemValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VaultItemValues>({
    resolver: zodResolver(vaultItemSchema),
    defaultValues: item
      ? {
          category: item.category,
          title: item.title,
          subtitle: item.subtitle ?? "",
          phone: item.phone ?? "",
          email: item.email ?? "",
          address: item.address ?? "",
          dateValue: item.date_value ?? "",
          notes: item.notes ?? "",
          isPinned: item.is_pinned,
        }
      : {
          category: initialCategory,
          title: "",
          subtitle: "",
          phone: "",
          email: "",
          address: "",
          dateValue: "",
          notes: "",
          isPinned: false,
        },
  });

  const category = watch("category");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="What kind of entry is this?">
        {(fieldProps) => (
          <Select {...fieldProps} {...register("category")}>
            {(
              Object.entries(VAULT_CATEGORIES) as [
                VaultCategory,
                (typeof VAULT_CATEGORIES)[VaultCategory],
              ][]
            ).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label={category === "note" ? "Note title" : "Name"}
        error={errors.title?.message}
        required
      >
        {(fieldProps) => (
          <Input
            placeholder={
              category === "medication"
                ? "e.g. Lisinopril"
                : category === "important_date"
                  ? "e.g. Wedding anniversary"
                  : category === "note"
                    ? "e.g. Where things are kept"
                    : "e.g. Maria Alvarez"
            }
            {...fieldProps}
            {...register("title")}
          />
        )}
      </Field>

      <Field label={SUBTITLE_LABEL[category]} error={errors.subtitle?.message}>
        {(fieldProps) => <Input {...fieldProps} {...register("subtitle")} />}
      </Field>

      {isPerson(category) && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone (optional)" error={errors.phone?.message}>
            {(fieldProps) => (
              <Input
                type="tel"
                autoComplete="off"
                placeholder="(555) 010-2345"
                {...fieldProps}
                {...register("phone")}
              />
            )}
          </Field>
          <Field label="Email (optional)" error={errors.email?.message}>
            {(fieldProps) => (
              <Input
                type="email"
                autoComplete="off"
                {...fieldProps}
                {...register("email")}
              />
            )}
          </Field>
        </div>
      )}

      {isPerson(category) && (
        <Field label="Address (optional)" error={errors.address?.message}>
          {(fieldProps) => <Input {...fieldProps} {...register("address")} />}
        </Field>
      )}

      {category === "important_date" && (
        <Field label="The date" error={errors.dateValue?.message}>
          {(fieldProps) => (
            <Input type="date" {...fieldProps} {...register("dateValue")} />
          )}
        </Field>
      )}

      <Field
        label={category === "note" ? "The note" : "Notes (optional)"}
        error={errors.notes?.message}
      >
        {(fieldProps) => (
          <Textarea
            rows={category === "note" ? 5 : 3}
            placeholder="Anything worth remembering."
            {...fieldProps}
            {...register("notes")}
          />
        )}
      </Field>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3">
        <input
          type="checkbox"
          className="size-6 accent-sage-600"
          {...register("isPinned")}
        />
        <span className="text-base font-medium text-sand-800">
          Pin to the top — for the things you look up most
        </span>
      </label>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {item ? "Save changes" : "Add to vault"}
        </Button>
      </div>
    </form>
  );
}
