"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConfirmDisputeExpense } from "@/components/ConfirmDisputeExpense";
import { useWallet } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";
import { useGroup } from "@/lib/stellar/useGroup";
import { fetchExpense, type Expense } from "@/lib/stellar/queries";
import { confirmExpense, disputeExpense } from "@/lib/stellar/mutations";
import { explorerTxUrl } from "@/lib/stellar/config";

export default function ConfirmExpensePage() {
  const { id, expenseId } = useParams<{ id: string; expenseId: string }>();
  const groupId = BigInt(id);
  const expenseIdBig = BigInt(expenseId);
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { group, tokenSymbol, loading: groupLoading } = useGroup(groupId);

  const [expense, setExpense] = useState<Expense | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading flag before fetching
    setExpenseLoading(true);
    fetchExpense(address, groupId, expenseIdBig)
      .then(setExpense)
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load expense"))
      .finally(() => setExpenseLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, groupId, expenseIdBig]);

  async function handleConfirm() {
    if (!address || !expense) return;
    const isPayer = expense.payer === address;
    const { txHash } = await confirmExpense(address, { groupId, expenseId: expenseIdBig });
    showToast(
      isPayer
        ? "Confirmed — you're the payer, so this doesn't change your balance"
        : "Confirmed — added to your balance",
      txHash ? explorerTxUrl(txHash) : undefined,
    );
    router.push(`/groups/${groupId}?tab=expenses`);
  }

  async function handleDispute() {
    if (!address) return;
    const { txHash } = await disputeExpense(address, { groupId, expenseId: expenseIdBig });
    showToast("Disputed — excluded from balances", txHash ? explorerTxUrl(txHash) : undefined);
    router.push(`/groups/${groupId}?tab=expenses`);
  }

  if (!address) return null;
  if (groupLoading || expenseLoading || !group || !expense) {
    return <div className="text-text-dim text-sm">Loading expense…</div>;
  }

  return (
    <ConfirmDisputeExpense
      group={group}
      expense={expense}
      tokenSymbol={tokenSymbol}
      walletAddress={address}
      onBack={() => router.push(`/groups/${groupId}?tab=expenses`)}
      onConfirm={handleConfirm}
      onDispute={handleDispute}
    />
  );
}
