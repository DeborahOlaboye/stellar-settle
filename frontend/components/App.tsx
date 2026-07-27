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
import { Cashout } from "./Cashout";
import { Toast } from "./ui/Toast";
import { connectFreighter, FreighterNotInstalledError } from "@/lib/stellar/freighter";
import {
  fetchMemberGroups,
  fetchGroup,
  fetchGroupExpenses,
  fetchMemberBalance,
  fetchPreviewSettlement,
  fetchTokenBalance,
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
  | "settleStatus"
  | "cashout";

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

  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

  const symbolCache = useRef<Map<string, string>>(new Map());

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const symbolFor = useCallback(async (tokenId: string): Promise<string> => {
    const cached = symbolCache.current.get(tokenId);
    if (cached) return cached;
    const symbol = await fetchTokenSymbol(null, tokenId);
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
          const [yourBalance, symbol] = await Promise.all([
            fetchMemberBalance(address, id, address),
            symbolFor(g.token),
          ]);
          return { id, name: g.name, token: g.token, tokenSymbol: symbol, members: g.members, yourBalance };
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
    setExpensesLoaded(false);
    setBalancesLoading(true);
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
    setExpensesLoaded(false);
    setScreen("group");
    setGroupTab("expenses");
    await handleTabChange("expenses");
  }

  function openConfirmExpense(expenseId: bigint) {
    const e = expenses.find((x) => x.id === expenseId);
    if (!e) return;
    setSelectedExpense(e);
    setScreen("confirmExpense");
  }

  async function handleConfirm() {
    if (!currentGroup || !walletAddress || !selectedExpense) return;
    await confirmExpense(walletAddress, { groupId: currentGroup.id, expenseId: selectedExpense.id });
    showToast("Confirmed — added to your balance");
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

  async function openCashout() {
    setScreen("cashout");
    if (walletAddress) {
      try {
        setTokenBalance(await fetchTokenBalance(walletAddress));
      } catch (err) {
        setTokenBalance(null);
        showToast(
          "Couldn't load your balance — make sure your testnet account is funded via Friendbot. " +
            (err instanceof Error ? err.message : ""),
        );
      }
    }
  }

  if (screen === "landing" || !walletAddress) {
    return <Landing connecting={connecting} onConnect={handleConnect} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <Sidebar
        active={screen === "cashout" ? "cashout" : "groups"}
        onNavGroups={() => setScreen("groups")}
        onNavCashout={openCashout}
        walletAddress={walletAddress}
        onDisconnect={handleDisconnect}
      />
      <MobileNav
        active={screen === "cashout" ? "cashout" : "groups"}
        onNavGroups={() => setScreen("groups")}
        onNavCashout={openCashout}
        walletAddress={walletAddress}
        onDisconnect={handleDisconnect}
      />

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
              onCashOut={openCashout}
            />
          )}

          {screen === "cashout" && (
            <Cashout tokenSymbol={tokenSymbol || "SETL"} tokenBalance={tokenBalance} onBack={() => setScreen("groups")} />
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
