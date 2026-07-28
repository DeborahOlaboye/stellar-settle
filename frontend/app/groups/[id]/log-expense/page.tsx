"use client";

import { useParams, useRouter } from "next/navigation";
import { LogExpenseForm } from "@/components/LogExpenseForm";
import { useWallet } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";
import { useGroup } from "@/lib/stellar/useGroup";
import { logExpense } from "@/lib/stellar/mutations";
import { explorerTxUrl } from "@/lib/stellar/config";

export default function LogExpensePage() {
  const { id } = useParams<{ id: string }>();
  const groupId = BigInt(id);
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { group, tokenSymbol, loading } = useGroup(groupId);

  async function handleSubmit(args: { payer: string; amount: bigint; description: string; participants: string[] }) {
    if (!address) return;
    const { txHash } = await logExpense(address, { groupId, ...args });
    showToast("Expense logged — awaiting confirmations", txHash ? explorerTxUrl(txHash) : undefined);
    router.push(`/groups/${groupId}?tab=expenses`);
  }

  if (!address) return null;
  if (loading || !group) return <div className="text-text-dim text-sm">Loading group…</div>;

  return (
    <LogExpenseForm
      group={group}
      tokenSymbol={tokenSymbol}
      walletAddress={address}
      onBack={() => router.push(`/groups/${groupId}`)}
      onSubmit={handleSubmit}
    />
  );
}
