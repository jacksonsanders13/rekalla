import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VaultView } from "@/components/vault/vault-view";

export const metadata: Metadata = { title: "Memory Vault" };

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <VaultView userId={user!.id} />;
}
