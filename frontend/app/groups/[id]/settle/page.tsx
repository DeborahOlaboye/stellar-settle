"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SettlementPreview } from "@/components/SettlementPreview";
import { SettleStatus } from "@/components/SettleStatus";
import { useWallet } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";
import { useGroup } from "@/lib/stellar/useGroup";
import { fetchPreviewSettlement, type Transfer } from "@/lib/stellar/queries";
import { buildSettleTransaction, pendingSigners, type SettleTx } from "@/lib/stellar/settleFlow";

export default function SettlePage() {
  const { id } = useParams<{ id: string }>();
  const groupId = BigInt(id);
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { group, tokenSymbol, loading: groupLoading } = useGroup(groupId);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [settleTx, setSettleTx] = useState<SettleTx | null>(null);
  const [debtors, setDebtors] = useState<string[]>([]);

  useEffect(() => {
    if (!address) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading flag before fetching
    setPreviewLoading(true);
    fetchPreviewSettlement(address, groupId)
      .then(setTransfers)
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to compute settlement"))
      .finally(() => setPreviewLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, groupId]);

  async function handleConfirmSettle() {
    if (!address) return;
    setSubmitting(true);
    try {
      const tx = await buildSettleTransaction(address, groupId);
      setSettleTx(tx);
      setDebtors(pendingSigners(tx));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to prepare settlement");
    } finally {
      setSubmitting(false);
    }
  }

  if (!address) return null;
  if (groupLoading || !group) return <div className="text-text-dim text-sm">Loading group…</div>;

  if (settleTx) {
    return (
      <SettleStatus
        groupId={groupId}
        groupName={group.name}
        tokenSymbol={tokenSymbol}
        transfersCount={transfers.length}
        tx={settleTx}
        debtors={debtors}
        onDone={() => router.push(`/groups/${groupId}`)}
      />
    );
  }

  return (
    <SettlementPreview
      groupName={group.name}
      tokenSymbol={tokenSymbol}
      transfers={transfers}
      loading={previewLoading}
      walletAddress={address}
      onCancel={() => router.push(`/groups/${groupId}`)}
      onConfirmSettle={handleConfirmSettle}
      submitting={submitting}
    />
  );
}
