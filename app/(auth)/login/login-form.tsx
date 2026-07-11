"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
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
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "That email and password don't match. Please try again."
          : error.message,
      );
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
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
