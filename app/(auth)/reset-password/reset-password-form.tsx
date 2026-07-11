"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { AuthCard, AuthError } from "../auth-card";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setServerError(
        error.message.includes("session")
          ? "This reset link has expired. Please request a new one."
          : error.message,
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something memorable — at least 8 characters."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthError message={serverError} />

        <Field label="New password" error={errors.password?.message}>
          {(fieldProps) => (
            <PasswordInput
              autoComplete="new-password"
              placeholder="New password"
              {...fieldProps}
              {...register("password")}
            />
          )}
        </Field>

        <Field
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          {(fieldProps) => (
            <PasswordInput
              autoComplete="new-password"
              placeholder="Type it once more"
              {...fieldProps}
              {...register("confirmPassword")}
            />
          )}
        </Field>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Save new password
        </Button>
      </form>
    </AuthCard>
  );
}
