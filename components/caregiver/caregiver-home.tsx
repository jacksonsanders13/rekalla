"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LinkIcon, Users } from "lucide-react";
import { initials } from "@/lib/utils";
import { useMyPatients, useConnectWithCode } from "@/hooks/use-care";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";

/** A caregiver's home: connect by code, then the people they care for. */
export function CaregiverHome({ caregiverId }: { caregiverId: string }) {
  const toast = useToast();
  const [code, setCode] = useState("");

  const patients = useMyPatients(caregiverId);
  const connect = useConnectWithCode(caregiverId);

  function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    connect.mutate(trimmed, {
      onSuccess: (patient) => {
        setCode("");
        toast(`Connected to ${patient.full_name || "your person"}.`);
      },
      onError: (error) => toast(error.message, "error"),
    });
  }

  return (
    <div>
      <PageHeader
        title="People"
        description="For everyone you look after."
      />

      <Card className="animate-fade-up">
        <CardHeader title="Connect to someone" />
        <CardBody>
          <p className="mb-4 text-base text-label-3">
            Ask the person you care for to open Rekalla and read you their
            connect code, then type it in here.
          </p>
          <form onSubmit={handleConnect} className="space-y-4" noValidate>
            <Field label="Their connect code">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="e.g. R7K2QX"
                  maxLength={6}
                  className="font-mono text-xl tracking-[0.2em]"
                />
              )}
            </Field>
            <Button type="submit" loading={connect.isPending}>
              <LinkIcon className="size-5" aria-hidden="true" />
              Connect
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-2xl font-bold text-label">People I care for</h2>
        {patients.isLoading ? (
          <CardSkeleton rows={2} />
        ) : (patients.data ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one connected yet"
            description="Once you enter someone's connect code above, they'll show up here and you can manage their reminders, routine, and vault."
          />
        ) : (
          <ul className="space-y-3">
            {(patients.data ?? []).map((link) => (
              <li key={link.relationshipId}>
                <Link
                  href={`/caregiver/${link.profile.id}`}
                  className="flex items-center gap-4 rounded-3xl bg-elev-1 p-5 transition-colors hover:bg-elev-2"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tint-purple/20 text-xl font-semibold text-tint-purple"
                  >
                    {initials(link.profile.full_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-label">
                      {link.profile.full_name || "Patient"}
                    </span>
                    <span className="block text-base text-label-3">
                      Reminders, routine &amp; wellness
                    </span>
                  </span>
                  <ArrowRight
                    className="size-6 shrink-0 text-label-4"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
