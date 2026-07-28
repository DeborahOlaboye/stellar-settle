"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupsDashboard } from "@/components/GroupsDashboard";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useWallet } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";
import { fetchMemberGroups, fetchGroup, fetchMemberBalance, fetchGroupExpenses } from "@/lib/stellar/queries";
import { symbolFor } from "@/lib/stellar/symbolCache";
import { createGroup } from "@/lib/stellar/mutations";
import { explorerTxUrl } from "@/lib/stellar/config";
import type { GroupSummary } from "@/lib/appTypes";

export default function GroupsPage() {
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const ids = await fetchMemberGroups(address);
      const summaries = await Promise.all(
        ids.map(async (id) => {
          const g = await fetchGroup(address, id);
          const [yourBalance, symbol, expenses] = await Promise.all([
            fetchMemberBalance(address, id, address),
            symbolFor(g.token),
            fetchGroupExpenses(address, id),
          ]);
          const pendingReviewCount = expenses.filter(
            (e) => e.participants.includes(address) && !e.confirmed.includes(address) && !e.disputed.includes(address),
          ).length;
          return {
            id,
            name: g.name,
            token: g.token,
            tokenSymbol: symbol,
            members: g.members,
            yourBalance,
            pendingReviewCount,
          };
        }),
      );
      setGroups(summaries);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadGroups sets a loading flag before fetching
    loadGroups();
  }, [loadGroups]);

  async function handleCreateGroup(args: { name: string; token: string; members: string[] }) {
    if (!address) return;
    const { groupId, txHash } = await createGroup(address, args);
    setShowCreateGroup(false);
    showToast("Group created", txHash ? explorerTxUrl(txHash) : undefined);
    router.push(`/groups/${groupId}`);
  }

  if (!address) return null;

  return (
    <>
      <GroupsDashboard
        groups={groups}
        loading={loading}
        walletAddress={address}
        onOpen={(id) => router.push(`/groups/${id}`)}
        onCreateGroup={() => setShowCreateGroup(true)}
      />
      {showCreateGroup && (
        <CreateGroupModal
          walletAddress={address}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </>
  );
}
