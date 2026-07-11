"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, HeartHandshake, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { AuthCard, AuthError } from "../auth-card";

const ACCOUNT_OPTIONS = [
  {
    value: "patient" as const,
    icon: User,
    title: "Loved One",
    detail: "Someone sets up reminders for me.",
  },
  {
    value: "caregiver" as const,
    icon: HeartHandshake,
    title: "Caregiver",
    detail: "I set up reminders for someone I care for.",
  },
];

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { accountType: "patient" },
  });

  async function onSubmit(values: SignupValues) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName, account_type: values.accountType },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // When email confirmation is enabled, there's no session yet.
    if (!data.session) {
      setNeedsConfirmation(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent you a confirmation link. Open it to finish creating your account."
      >
        <div className="flex justify-center py-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white">
            <MailCheck className="size-8" aria-hidden="true" />
          </div>
        </div>
        <p className="text-center text-base text-label-3">
          Once you&apos;ve confirmed, you can{" "}
          <Link
            href="/login"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            log in here
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="A few details and you're all set — it takes about a minute."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthError message={serverError} />

        <Controller
          control={control}
          name="accountType"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 block text-base font-semibold text-label-2">
                Who is this account for?
              </legend>
              <div className="grid gap-3">
                {ACCOUNT_OPTIONS.map((option) => {
                  const selected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors",
                        selected
                          ? "border-white bg-white/10"
                          : "border-transparent bg-elev-2 hover:bg-elev-3",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl",
                          selected ? "bg-white text-black" : "bg-elev-3 text-label-2",
                        )}
                      >
                        <option.icon className="size-6" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-label">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-label-3">
                          {option.detail}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        />

        <Field label="Your name" error={errors.fullName?.message}>
          {(fieldProps) => (
            <Input
              autoComplete="name"
              placeholder="Rose Alvarez"
              {...fieldProps}
              {...register("fullName")}
            />
          )}
        </Field>

        <Field label="Email address" error={errors.email?.message}>
          {(fieldProps) => (
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...fieldProps}
              {...register("email")}
            />
          )}
        </Field>

        <Field
          label="Password"
          hint="At least 8 characters."
          error={errors.password?.message}
        >
          {(fieldProps) => (
            <PasswordInput
              autoComplete="new-password"
              placeholder="Choose a password"
              {...fieldProps}
              {...register("password")}
            />
          )}
        </Field>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-7 text-center text-base text-label-3">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
