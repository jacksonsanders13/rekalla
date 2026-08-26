import type { Metadata } from "next";
import { requirePatient } from "@/lib/session";
import { VaultView } from "@/components/vault/vault-view";

export const metadata: Metadata = { title: "Memory Vault" };

export default async function VaultPage() {
  const { user } = await requirePatient();

  return (
    <VaultView
      userId={user.id}
      canManage
      description="People, doctors, medications, and important details, kept in one place. Add your own, or ask Rekalla to remember something."
    />
  );
}
