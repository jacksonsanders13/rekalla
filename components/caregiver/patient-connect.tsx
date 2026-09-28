"use client";

import { useState } from "react";
import { Copy, Check, HeartHandshake, UserMinus } from "lucide-react";
import { initials } from "@/lib/utils";
import { useMyCaregivers, useEndRelationship } from "@/hooks/use-care";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import type { LinkedPerson } from "@/hooks/use-care";

/**
 * A patient's connection screen: shows the code to read out to a caregiver,
 * plus the caregivers who are already connected.
 */
export function PatientConnect({
  patientId,
  connectCode,
}: {
  patientId: string;
  connectCode: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<LinkedPerson | undefined>();

  const caregivers = useMyCaregivers(patientId);
  const endRelationship = useEndRelationship(patientId);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(connectCode);
      setCopied(true);
      toast("Code copied.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Couldn't copy — you can read it out instead.", "info");
    }
  }

  return (
    <div>
      <PageHeader
        title="Caregivers"
        description="For the people who help you."
      />

      <Card className="animate-fade-up">
        <CardBody className="text-center">
          <p className="text-base text-label-3">
            Your connect code
          </p>
          <p className="mt-2 select-all font-mono text-4xl font-bold tracking-[0.2em] text-label">
            {connectCode}
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={copyCode}
          >
            {copied ? (
              <Check className="size-5" aria-hidden="true" />
            ) : (
              <Copy className="size-5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy code"}
          </Button>
          <p className="mx-auto mt-5 max-w-sm text-base text-label-3">
            Give this code to the person who cares for you. They&apos;ll type
            it into their own Rekalla account to connect.
          </p>
        </CardBody>
      </Card>

      <div className="mt-6">
        <Card className="animate-fade-up [animation-delay:60ms]">
          <CardHeader title="Connected caregivers" />
          <CardBody>
            {caregivers.isLoading ? (
              <CardSkeleton rows={1} />
            ) : (caregivers.data ?? []).length === 0 ? (
              <div className="flex items-center gap-3 text-base text-label-3">
                <HeartHandshake
                  className="size-6 shrink-0 text-label-4"
                  aria-hidden="true"
                />
                No caregivers yet. Share your code above to connect one.
              </div>
            ) : (
              <ul className="space-y-3">
                {(caregivers.data ?? []).map((link) => (
                  <li
                    key={link.relationshipId}
                    className="flex items-center gap-4 rounded-2xl bg-elev-2 p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint-blue/20 text-base font-semibold text-tint-blue"
                    >
                      {initials(link.profile.full_name)}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-base font-semibold text-label">
                      {link.profile.full_name || "Caregiver"}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove ${link.profile.full_name}`}
                      onClick={() => setRemoving(link)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-label-3 transition-colors hover:bg-tint-red/10 hover:text-tint-red"
                    >
                      <UserMinus className="size-5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(undefined)}
        title="Remove this caregiver?"
        description={
          removing
            ? `${removing.profile.full_name || "This caregiver"} will no longer see your schedule or manage your reminders.`
            : undefined
        }
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setRemoving(undefined)}>
            Keep them
          </Button>
          <Button
            variant="danger"
            loading={endRelationship.isPending}
            onClick={() =>
              removing &&
              endRelationship.mutate(removing.relationshipId, {
                onSuccess: () => {
                  setRemoving(undefined);
                  toast("Caregiver removed.", "info");
                },
                onError: () =>
                  toast("Something went wrong. Please try again.", "error"),
              })
            }
          >
            Remove
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
