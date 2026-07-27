"use client";

import { useCallback, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { Landing } from "./Landing";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { GroupsDashboard } from "./GroupsDashboard";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupDetail } from "./GroupDetail";
import { LogExpenseForm } from "./LogExpenseForm";
import { ConfirmDisputeExpense } from "./ConfirmDisputeExpense";
import { SettlementPreview } from "./SettlementPreview";
import { SettleStatus } from "./SettleStatus";
import { Toast } from "./ui/Toast";
import { connectFreighter, FreighterNotInstalledError } from "@/lib/stellar/freighter";
import {
  fetchMemberGroups,
  fetchGroup,
  fetchGroupExpenses,
  fetchMemberBalance,
  fetchPreviewSettlement,
  fetchTokenSymbol,
  Group,
  Expense,
} from "@/lib/stellar/queries";
import { createGroup, logExpense, confirmExpense, disputeExpense } from "@/lib/stellar/mutations";
import { buildSettleTransaction, pendingSigners, type SettleTx } from "@/lib/stellar/settleFlow";
import type { GroupSummary } from "@/lib/appTypes";

type Screen =
  | "landing"
  | "groups"
  | "group"
  | "logExpense"
  | "confirmExpense"
  | "settlePreview"
  | "settleStatus";

export function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [screen, setScreen] = useState<Screen>("landing");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [balances, setBalances] = useState<Map<string, bigint>>(new Map());
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [groupTab, setGroupTab] = useState<"balances" | "expenses">("balances");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [previewTransfers, setPreviewTransfers] = useState<[] | Awaited<ReturnType<typeof fetchPreviewSettlement>>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [settleTx, setSettleTx] = useState<SettleTx | null>(null);
  const [settleDebtors, setSettleDebtors] = useState<string[]>([]);

  const symbolCache = useRef<Map<string, string>>(new Map());

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const symbolFor = useCallback(async (tokenId: string): Promise<string> => {
    const cached = symbolCache.current.get(tokenId);
    if (cached) return cached;
    const raw = await fetchTokenSymbol(null, tokenId);
    // The native XLM SAC's symbol() call returns the classic asset code
    // "native", not "XLM" — display the name people actually recognize.
    const symbol = raw === "native" ? "XLM" : raw;
    symbolCache.current.set(tokenId, symbol);
    return symbol;
  }, []);

  const loadGroups = useCallback(async (address: string) => {
    setGroupsLoading(true);
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
      setGroupsLoading(false);
    }
  }, [symbolFor]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const address = await connectFreighter();
      setWalletAddress(address);
      setScreen("groups");
      track("wallet_connected", { address });
      await loadGroups(address);
    } catch (err) {
      if (err instanceof FreighterNotInstalledError) {
        showToast("Install the Freighter wallet extension to continue");
      } else {
        showToast(err instanceof Error ? err.message : "Failed to connect wallet");
      }
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setWalletAddress(null);
    setScreen("landing");
    setGroups([]);
    setCurrentGroup(null);
  }

  async function handleCreateGroup(args: { name: string; token: string; members: string[] }) {
    if (!walletAddress) return;
    const id = await createGroup(walletAddress, args);
    setShowCreateGroup(false);
    showToast("Group created");
    track("group_created", { groupId: id.toString(), memberCount: args.members.length });
    await loadGroups(walletAddress);
    await openGroup(id);
  }

  async function openGroup(id: bigint) {
    if (!walletAddress) return;
    setScreen("group");
    setGroupTab("balances");
    setBalancesLoading(true);
    setExpensesLoading(true);
    try {
      const g = await fetchGroup(walletAddress, id);
      setCurrentGroup(g);
      const symbol = await symbolFor(g.token);
      setTokenSymbol(symbol);
      const entries = await Promise.all(
        g.members.map(async (m) => [m, await fetchMemberBalance(walletAddress, id, m)] as const),
      );
      setBalances(new Map(entries));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setBalancesLoading(false);
    }
    // Fetched eagerly (not just on tab switch) so the Balances tab can show
    // a "needs your review" banner without the user having to think to
    // check the Expenses tab first.
    try {
      const list = await fetchGroupExpenses(walletAddress, id);
      setExpenses(list);
      setExpensesLoaded(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setExpensesLoading(false);
    }
  }

  async function handleTabChange(tab: "balances" | "expenses") {
    setGroupTab(tab);
    if (tab === "expenses" && !expensesLoaded && currentGroup && walletAddress) {
      setExpensesLoading(true);
      try {
        const list = await fetchGroupExpenses(walletAddress, currentGroup.id);
        setExpenses(list);
        setExpensesLoaded(true);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to load expenses");
      } finally {
        setExpensesLoading(false);
      }
    }
  }

  async function refreshBalances() {
    if (!currentGroup || !walletAddress) return;
    const entries = await Promise.all(
      currentGroup.members.map(async (m) => [m, await fetchMemberBalance(walletAddress, currentGroup.id, m)] as const),
    );
    setBalances(new Map(entries));
  }

  async function refreshExpenses() {
    if (!currentGroup || !walletAddress) return;
    const list = await fetchGroupExpenses(walletAddress, currentGroup.id);
    setExpenses(list);
  }

  async function handleLogExpense(args: { payer: string; amount: bigint; description: string; participants: string[] }) {
    if (!currentGroup || !walletAddress) return;
    await logExpense(walletAddress, { groupId: currentGroup.id, ...args });
    showToast("Expense logged — awaiting confirmations");
    track("expense_logged", { groupId: currentGroup.id.toString(), participantCount: args.participants.length });
    setScreen("group");
    setGroupTab("expenses");
    // Fetch directly instead of going through handleTabChange's
    // !expensesLoaded guard — setExpensesLoaded(false) above wouldn't take
    // effect until the next render, so that guard would still see the old
    // (already-loaded) value and skip re-fetching, leaving the just-logged
    // expense missing until a manual page refresh.
    await refreshExpenses();
    setExpensesLoaded(true);
  }

  function openConfirmExpense(expenseId: bigint) {
    const e = expenses.find((x) => x.id === expenseId);
    if (!e) return;
    setSelectedExpense(e);
    setScreen("confirmExpense");
  }

  async function handleConfirm() {
    if (!currentGroup || !walletAddress || !selectedExpense) return;
    const isPayer = selectedExpense.payer === walletAddress;
    await confirmExpense(walletAddress, { groupId: currentGroup.id, expenseId: selectedExpense.id });
    showToast(
      isPayer
        ? "Confirmed — you're the payer, so this doesn't change your balance"
        : "Confirmed — added to your balance",
    );
    track("expense_confirmed", { groupId: currentGroup.id.toString() });
    setScreen("group");
    setGroupTab("expenses");
    await Promise.all([refreshBalances(), refreshExpenses()]);
  }

  async function handleDispute() {
    if (!currentGroup || !walletAddress || !selectedExpense) return;
    await disputeExpense(walletAddress, { groupId: currentGroup.id, expenseId: selectedExpense.id });
    showToast("Disputed — excluded from balances");
    track("expense_disputed", { groupId: currentGroup.id.toString() });
    setScreen("group");
    setGroupTab("expenses");
    await refreshExpenses();
  }

  async function openSettlePreview() {
    if (!currentGroup || !walletAddress) return;
    setScreen("settlePreview");
    setPreviewLoading(true);
    try {
      const transfers = await fetchPreviewSettlement(walletAddress, currentGroup.id);
      setPreviewTransfers(transfers);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to compute settlement");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleConfirmSettle() {
    if (!currentGroup || !walletAddress) return;
    setSettling(true);
    try {
      const tx = await buildSettleTransaction(walletAddress, currentGroup.id);
      setSettleTx(tx);
      setSettleDebtors(pendingSigners(tx));
      setScreen("settleStatus");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to prepare settlement");
    } finally {
      setSettling(false);
    }
  }

  async function handleSettleDone() {
    setScreen("group");
    setGroupTab("balances");
    setSettleTx(null);
    setExpensesLoaded(false);
    await Promise.all([refreshBalances(), walletAddress && loadGroups(walletAddress)]);
  }

  if (screen === "landing" || !walletAddress) {
    return <Landing connecting={connecting} onConnect={handleConnect} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <Sidebar onNavGroups={() => setScreen("groups")} walletAddress={walletAddress} onDisconnect={handleDisconnect} />
      <MobileNav onNavGroups={() => setScreen("groups")} walletAddress={walletAddress} onDisconnect={handleDisconnect} />

      <div className="flex-1 min-w-0 px-5 py-6 sm:px-12 sm:py-10">
        <div className="max-w-[860px]">
          {screen === "groups" && (
            <GroupsDashboard
              groups={groups}
              loading={groupsLoading}
              walletAddress={walletAddress}
              onOpen={openGroup}
              onCreateGroup={() => setShowCreateGroup(true)}
            />
          )}

          {screen === "group" && currentGroup && (
            <GroupDetail
              group={currentGroup}
              tokenSymbol={tokenSymbol}
              balances={balances}
              expenses={expenses}
              balancesLoading={balancesLoading}
              expensesLoading={expensesLoading}
              tab={groupTab}
              walletAddress={walletAddress}
              onBack={() => setScreen("groups")}
              onTabChange={handleTabChange}
              onLogExpense={() => setScreen("logExpense")}
              onOpenExpense={openConfirmExpense}
              onSettleUp={openSettlePreview}
            />
          )}

          {screen === "logExpense" && currentGroup && (
            <LogExpenseForm
              group={currentGroup}
              tokenSymbol={tokenSymbol}
              walletAddress={walletAddress}
              onBack={() => setScreen("group")}
              onSubmit={handleLogExpense}
            />
          )}

          {screen === "confirmExpense" && currentGroup && selectedExpense && (
            <ConfirmDisputeExpense
              group={currentGroup}
              expense={selectedExpense}
              tokenSymbol={tokenSymbol}
              walletAddress={walletAddress}
              onBack={() => setScreen("group")}
              onConfirm={handleConfirm}
              onDispute={handleDispute}
            />
          )}

          {screen === "settlePreview" && currentGroup && (
            <SettlementPreview
              groupName={currentGroup.name}
              tokenSymbol={tokenSymbol}
              transfers={previewTransfers}
              loading={previewLoading}
              walletAddress={walletAddress}
              onCancel={() => setScreen("group")}
              onConfirmSettle={handleConfirmSettle}
              submitting={settling}
            />
          )}

          {screen === "settleStatus" && currentGroup && settleTx && (
            <SettleStatus
              groupName={currentGroup.name}
              tokenSymbol={tokenSymbol}
              transfersCount={previewTransfers.length}
              tx={settleTx}
              debtors={settleDebtors}
              onDone={handleSettleDone}
            />
          )}
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          walletAddress={walletAddress}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
