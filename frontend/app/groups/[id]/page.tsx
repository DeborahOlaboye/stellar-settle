"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { GroupDetail } from "@/components/GroupDetail";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useWallet } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";
import { useGroup } from "@/lib/stellar/useGroup";
import { fetchMemberBalance, fetchGroupExpenses, type Expense } from "@/lib/stellar/queries";
import { fetchGroupActivity, type ActivityEvent } from "@/lib/stellar/activity";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = BigInt(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { group, tokenSymbol, loading: groupLoading, error: groupError } = useGroup(groupId);

  const tab = searchParams.get("tab") === "expenses" ? "expenses" : "balances";

  const [balances, setBalances] = useState<Map<string, bigint>>(new Map());
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const refreshBalances = useCallback(async () => {
    if (!address || !group) return;
    const entries = await Promise.all(
      group.members.map(async (m) => [m, await fetchMemberBalance(address, groupId, m)] as const),
    );
    setBalances(new Map(entries));
  }, [address, group, groupId]);

  const refreshExpenses = useCallback(async () => {
    if (!address) return;
    const list = await fetchGroupExpenses(address, groupId);
    setExpenses(list);
  }, [address, groupId]);

  useEffect(() => {
    if (!group) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading flags before each fetch
    setBalancesLoading(true);
    refreshBalances()
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load balances"))
      .finally(() => setBalancesLoading(false));

    setExpensesLoading(true);
    refreshExpenses()
      .catch((err) => showToast(err instanceof Error ? err.message : "Failed to load expenses"))
      .finally(() => setExpensesLoading(false));

    setActivityLoading(true);
    fetchGroupActivity(groupId)
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  useEffect(() => {
    if (groupError) showToast(groupError);
  }, [groupError, showToast]);

  if (!address) return null;
  if (groupLoading || !group) {
    return <div className="text-text-dim text-sm">Loading group…</div>;
  }

  return (
    <>
      <GroupDetail
        group={group}
        tokenSymbol={tokenSymbol}
        balances={balances}
        expenses={expenses}
        balancesLoading={balancesLoading}
        expensesLoading={expensesLoading}
        tab={tab}
        walletAddress={address}
        onBack={() => router.push("/groups")}
        onTabChange={(t) => router.push(`/groups/${groupId}?tab=${t}`)}
        onLogExpense={() => router.push(`/groups/${groupId}/log-expense`)}
        onOpenExpense={(expenseId) => router.push(`/groups/${groupId}/expenses/${expenseId}`)}
        onSettleUp={() => router.push(`/groups/${groupId}/settle`)}
      />
      <ActivityFeed
        events={activity}
        loading={activityLoading}
        tokenSymbol={tokenSymbol}
        walletAddress={address}
        expenses={expenses}
      />
    </>
  );
}
