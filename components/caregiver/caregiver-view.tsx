"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  HeartHandshake,
  Mail,
  UserPlus,
  X,
} from "lucide-react";
import { initials } from "@/lib/utils";
import {
  inviteCaregiverSchema,
  type InviteCaregiverValues,
} from "@/lib/validations/care";
import {
  useCareLinks,
  useInviteCaregiver,
  useAcceptInvitation,
  useEndRelationship,
} from "@/hooks/use-care";
import type { CareLink, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { PatientPanel } from "./patient-panel";

export function CaregiverView({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const toast = useToast();

  const links = useCareLinks(userId, email);
  const invite = useInviteCaregiver(userId);
  const accept = useAcceptInvitation(userId);
  const end = useEndRelationship(userId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteCaregiverValues>({
    resolver: zodResolver(inviteCaregiverSchema),
  });

  const grouped = useMemo(() => {
    const data = links.data ?? [];
    return {
      // Someone invited me and I haven't accepted yet.
      incoming: data.filter(
        (link) =>
          link.status === "pending" &&
          link.patient_id !== userId &&
          link.invited_email.toLowerCase() === email.toLowerCase(),
      ),
      // People whose care I'm part of.
      patients: data.filter(
        (link) => link.status === "active" && link.caregiver_id === userId,
      ),
      // My own caregivers and outstanding invitations.
      caregivers: data.filter((link) => link.patient_id === userId),
    };
  }, [links.data, userId, email]);

  if (selectedPatient) {
    return (
      <PatientPanel
        patient={selectedPatient}
        caregiverId={userId}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  function onInvite(values: InviteCaregiverValues) {
    invite.mutate(
      { email: values.email, relationship: values.relationship || null },
      {
        onSuccess: () => {
          reset();
          toast("Invitation sent. They'll see it when they sign in.");
        },
        onError: (error) =>
          toast(
            error.message.includes("duplicate")
              ? "You've already invited that person."
              : "Something went wrong. Please try again.",
            "error",
          ),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Caregivers"
        description="Stay connected — monitor the people you care for, and choose who can support you."
      />

      {links.isLoading ? (
        <div className="space-y-6">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Incoming invitations */}
          {grouped.incoming.length > 0 && (
            <section aria-label="Invitations for you">
              <ul className="space-y-4">
                {grouped.incoming.map((link) => (
                  <li
                    key={link.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-sage-200 bg-sage-50 p-6"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sage-600 text-white">
                      <HeartHandshake className="size-6" aria-hidden="true" />
                    </div>
                    <p className="min-w-0 flex-1 text-lg text-sage-900">
                      <strong>{link.patient?.full_name ?? "Someone"}</strong>{" "}
                      has asked you to be their caregiver
                      {link.relationship ? ` (${link.relationship})` : ""}.
                    </p>
                    <div className="flex gap-2.5">
                      <Button
                        loading={accept.isPending}
                        onClick={() =>
                          accept.mutate(link.id, {
                            onSuccess: () =>
                              toast("You're now connected as a caregiver."),
                            onError: () =>
                              toast("Something went wrong. Please try again.", "error"),
                          })
                        }
                      >
                        <Check className="size-5" aria-hidden="true" />
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          end.mutate(link.id, {
                            onSuccess: () => toast("Invitation declined.", "info"),
                          })
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* People I care for */}
          <section aria-labelledby="patients-heading">
            <h2
              id="patients-heading"
              className="mb-4 text-2xl font-semibold text-sand-950"
            >
              People I care for
            </h2>
            {grouped.patients.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/50 p-6 text-base text-sand-600">
                When someone invites you to be their caregiver, they&apos;ll
                appear here — with their schedule, missed reminders, and
                wellness history.
              </p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2">
                {grouped.patients.map((link) =>
                  link.patient ? (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(link.patient)}
                        className="flex w-full items-center gap-4 rounded-2xl border border-sand-100 bg-white p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-plum-100 text-xl font-semibold text-plum-700"
                        >
                          {initials(link.patient.full_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-semibold text-sand-950">
                            {link.patient.full_name}
                          </span>
                          <span className="block text-base text-sand-600">
                            View schedule &amp; wellness
                          </span>
                        </span>
                        <ArrowRight
                          className="size-6 shrink-0 text-sand-400"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </section>

          {/* My caregivers */}
          <section aria-labelledby="caregivers-heading">
            <h2
              id="caregivers-heading"
              className="mb-4 text-2xl font-semibold text-sand-950"
            >
              My caregivers
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Invite someone you trust" />
                <CardBody>
                  <p className="mb-5 text-base text-sand-600">
                    They&apos;ll be able to see your schedule and wellness, and
                    add helpful reminders. You can remove them at any time.
                  </p>
                  <form
                    onSubmit={handleSubmit(onInvite)}
                    className="space-y-4"
                    noValidate
                  >
                    <Field label="Their email address" error={errors.email?.message} required>
                      {(fieldProps) => (
                        <Input
                          type="email"
                          placeholder="maria@example.com"
                          {...fieldProps}
                          {...register("email")}
                        />
                      )}
                    </Field>
                    <Field
                      label="Who are they to you? (optional)"
                      error={errors.relationship?.message}
                    >
                      {(fieldProps) => (
                        <Input
                          placeholder="e.g. Daughter"
                          {...fieldProps}
                          {...register("relationship")}
                        />
                      )}
                    </Field>
                    <Button type="submit" loading={invite.isPending}>
                      <UserPlus className="size-5" aria-hidden="true" />
                      Send invitation
                    </Button>
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="People who can help" />
                <CardBody>
                  {grouped.caregivers.length === 0 ? (
                    <p className="text-base text-sand-600">
                      No caregivers yet. Invite a family member or friend so
                      they can lend a hand.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {grouped.caregivers.map((link: CareLink) => (
                        <li
                          key={link.id}
                          className="flex items-center gap-4 rounded-xl border border-sand-100 p-4"
                        >
                          <span
                            aria-hidden="true"
                            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-700"
                          >
                            {link.caregiver ? (
                              initials(link.caregiver.full_name)
                            ) : (
                              <Mail className="size-5" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-sand-950">
                              {link.caregiver?.full_name ?? link.invited_email}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              {link.relationship && (
                                <span className="text-sm text-sand-500">
                                  {link.relationship}
                                </span>
                              )}
                              <Badge
                                tone={link.status === "active" ? "sage" : "honey"}
                              >
                                {link.status === "active" ? "Connected" : "Invited"}
                              </Badge>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${link.caregiver?.full_name ?? link.invited_email}`}
                            onClick={() =>
                              end.mutate(link.id, {
                                onSuccess: () => toast("Caregiver removed.", "info"),
                              })
                            }
                            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sand-400 transition-colors hover:bg-clay-50 hover:text-clay-600"
                          >
                            <X className="size-5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
