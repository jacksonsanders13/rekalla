"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";

const profileSchema = z.object({
  fullName: z.string().min(2, "Please enter your name.").max(120),
  phone: z.string().max(30).optional().or(z.literal("")),
  timezone: z.string().min(1),
});

type ProfileValues = z.infer<typeof profileSchema>;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Madrid",
  "Australia/Sydney",
];

export function SettingsView({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name,
      phone: profile.phone ?? "",
      timezone: profile.timezone,
    },
  });

  async function onSubmit(values: ProfileValues) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        phone: values.phone || null,
        timezone: values.timezone,
      })
      .eq("id", profile.id);

    if (error) {
      toast("Something went wrong. Please try again.", "error");
      return;
    }
    toast("Your details are saved.");
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your details and account."
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader title="About you" />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Field label="Your name" error={errors.fullName?.message} required>
                {(fieldProps) => (
                  <Input autoComplete="name" {...fieldProps} {...register("fullName")} />
                )}
              </Field>

              <Field
                label="Phone number (optional)"
                hint="Used for SMS reminders once they're enabled."
                error={errors.phone?.message}
              >
                {(fieldProps) => (
                  <Input type="tel" autoComplete="tel" {...fieldProps} {...register("phone")} />
                )}
              </Field>

              <Field label="Time zone" error={errors.timezone?.message}>
                {(fieldProps) => (
                  <Select {...fieldProps} {...register("timezone")}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ").replace("/", " — ")}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Button type="submit" loading={isSubmitting}>
                Save changes
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardBody className="space-y-5">
            <div>
              <p className="text-sm font-medium text-sand-500">Signed in as</p>
              <p className="text-lg font-semibold text-sand-950">{email}</p>
            </div>
            <Button variant="secondary" onClick={signOut}>
              <LogOut className="size-5" aria-hidden="true" />
              Sign out
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
