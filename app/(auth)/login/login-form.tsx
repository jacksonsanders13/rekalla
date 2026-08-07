"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { authErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { AuthCard, AuthError } from "../auth-card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "That email and password don't match. Please try again."
          : authErrorMessage(error),
      );
      return;
    }

    // Route by role directly so caregivers never get stranded on the
    // patient dashboard if a server-side redirect is cached.
    const next = searchParams.get("next");
    let destination = next && next.startsWith("/") ? next : "/dashboard";
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      if (profile?.account_type === "caregiver") {
        destination = "/caregiver";
      }
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see what's on your schedule today."
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

        <Field label="Password" error={errors.password?.message}>
          {(fieldProps) => (
            <PasswordInput
              autoComplete="current-password"
              placeholder="Your password"
              {...fieldProps}
              {...register("password")}
            />
          )}
        </Field>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-base font-medium text-white underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-7 text-center text-base text-label-3">
        New to Rekalla?{" "}
        <Link
          href="/signup"
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
