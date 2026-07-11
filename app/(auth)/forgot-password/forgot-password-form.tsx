"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { AuthCard, AuthError } from "../auth-card";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setServerError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If an account exists with that address, we've sent a link to reset your password."
      >
        <div className="flex justify-center py-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white">
            <MailCheck className="size-8" aria-hidden="true" />
          </div>
        </div>
        <p className="text-center text-base text-label-3">
          Remembered it after all?{" "}
          <Link
            href="/login"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthError message={serverError} />

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

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-7 text-center text-base text-label-3">
        <Link
          href="/login"
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
