import { Avatar } from "./ui/Avatar";
import { fromRawAmount, truncateAddress } from "@/lib/stellar/format";
import type { Group, Expense } from "@/lib/stellar/queries";

function expenseStatus(expense: Expense): { label: string; color: string } {
  if (expense.disputed.length > 0) return { label: "Disputed", color: "#E8567A" };
  if (expense.confirmed.length === expense.participants.length) return { label: "Confirmed", color: "#4FD1C5" };
  return { label: "Pending", color: "#E8734A" };
}

function needsReview(expense: Expense, walletAddress: string): boolean {
  return (
    expense.participants.includes(walletAddress) &&
    !expense.confirmed.includes(walletAddress) &&
    !expense.disputed.includes(walletAddress)
  );
}

export function GroupDetail({
  group,
  tokenSymbol,
  balances,
  expenses,
  balancesLoading,
  expensesLoading,
  tab,
  walletAddress,
  onBack,
  onTabChange,
  onLogExpense,
  onOpenExpense,
  onSettleUp,
}: {
  group: Group;
  tokenSymbol: string;
  balances: Map<string, bigint>;
  expenses: Expense[];
  balancesLoading: boolean;
  expensesLoading: boolean;
  tab: "balances" | "expenses";
  walletAddress: string;
  onBack: () => void;
  onTabChange: (tab: "balances" | "expenses") => void;
  onLogExpense: () => void;
  onOpenExpense: (expenseId: bigint) => void;
  onSettleUp: () => void;
}) {
  const allSettled = group.members.every((m) => (balances.get(m) ?? 0n) === 0n);
  const pendingForYou = expenses.filter((e) => needsReview(e, walletAddress));

  return (
    <div>
      <div onClick={onBack} className="font-mono text-[13px] text-text-faint cursor-pointer mb-3.5 hover:text-text-dim w-fit">
        &larr; Groups
      </div>
      <div className="flex items-start justify-between mb-5.5">
        <div>
          <h1 className="m-0 text-[26px] font-bold">{group.name}</h1>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex">
              {group.members.slice(0, 4).map((m) => (
                <Avatar key={m} address={m} isYou={m === walletAddress} size={26} overlap />
              ))}
            </div>
            <div className="font-mono text-xs text-text-faint">
              {group.members.length} members &middot; settles in {tokenSymbol}
            </div>
          </div>
        </div>
        <button
          onClick={onLogExpense}
          className="bg-transparent border border-border-strong text-text rounded-lg px-4.5 py-2.75 font-semibold text-sm cursor-pointer hover:border-accent hover:text-accent transition-colors"
        >
          + Log expense
        </button>
      </div>

      <div className="flex gap-1.5 border-b border-border-soft mb-5.5">
        <button
          onClick={() => onTabChange("balances")}
          className={`px-1 py-2.5 text-sm cursor-pointer mr-5.5 ${
            tab === "balances"
              ? "font-semibold text-text border-b-2 border-accent"
              : "font-medium text-text-faint border-b-2 border-transparent hover:text-text-dim"
          }`}
        >
          Balances
        </button>
        <button
          onClick={() => onTabChange("expenses")}
          className={`px-1 py-2.5 text-sm cursor-pointer ${
            tab === "expenses"
              ? "font-semibold text-text border-b-2 border-accent"
              : "font-medium text-text-faint border-b-2 border-transparent hover:text-text-dim"
          }`}
        >
          Expenses
        </button>
      </div>

      {!expensesLoading && pendingForYou.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-[rgba(232,115,74,0.10)] border border-[#3D2A22] rounded-lg px-4 py-3 mb-5.5">
          <div className="text-[13.5px] text-text">
            {pendingForYou.length === 1
              ? "You have 1 expense awaiting your confirmation."
              : `You have ${pendingForYou.length} expenses awaiting your confirmation.`}
          </div>
          <button
            onClick={() => onTabChange("expenses")}
            className="flex-none bg-accent text-bg rounded-md px-3 py-1.75 font-semibold text-[12.5px] cursor-pointer hover:bg-accent-hover transition-colors"
          >
            Review now
          </button>
        </div>
      )}

      {tab === "balances" && (
        <>
          {balancesLoading ? (
            <div className="text-text-dim text-sm">Loading balances…</div>
          ) : (
            <div className="flex flex-col gap-2.5 mb-6.5">
              {group.members.map((m) => {
                const amt = balances.get(m) ?? 0n;
                const isZero = amt === 0n;
                const positive = amt > 0n;
                return (
                  <div
                    key={m}
                    className="bg-panel border border-border rounded-[10px] px-4.5 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar address={m} isYou={m === walletAddress} size={32} />
                      <div className="text-[14.5px] font-medium">
                        {m === walletAddress ? "You" : truncateAddress(m)}
                      </div>
                      <div className="text-[13px] text-text-faint">
                        {isZero ? "settled up" : positive ? "is owed" : "owes"}
                      </div>
                    </div>
                    <div
                      className="font-mono text-[15px] font-semibold"
                      style={{ color: isZero ? "#726A82" : positive ? "#4FD1C5" : "#E8567A" }}
                    >
                      {isZero ? "0.00" : `${positive ? "+" : "-"}${fromRawAmount(amt < 0n ? -amt : amt)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!balancesLoading &&
            (allSettled ? (
              <div className="bg-panel border border-dashed border-border-strong rounded-[10px] px-5 py-4.5 text-center text-text-faint text-[13.5px]">
                All settled up &mdash; nothing to transfer.
              </div>
            ) : (
              <button
                onClick={onSettleUp}
                className="bg-accent text-bg rounded-lg px-5.5 py-3.25 font-semibold text-[14.5px] cursor-pointer hover:bg-accent-hover transition-colors"
              >
                Settle up &rarr;
              </button>
            ))}
        </>
      )}

      {tab === "expenses" && (
        <div className="flex flex-col gap-2.5">
          {expensesLoading && <div className="text-text-dim text-sm">Loading expenses…</div>}
          {!expensesLoading && expenses.length === 0 && (
            <div className="bg-panel border border-dashed border-border-strong rounded-[10px] px-5 py-4.5 text-center text-text-faint text-[13.5px]">
              No expenses logged yet.
            </div>
          )}
          {expenses
            .slice()
            .reverse()
            .map((e) => {
              const status = expenseStatus(e);
              const needsYourReview = needsReview(e, walletAddress);
              return (
                <div
                  key={e.id.toString()}
                  className="bg-panel border border-border rounded-[10px] px-4.5 py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-[14.5px] font-semibold">{e.description}</div>
                    <div className="font-mono text-xs text-text-faint mt-1">
                      Paid by {e.payer === walletAddress ? "you" : truncateAddress(e.payer)} &middot;{" "}
                      {e.participants.length} people
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="font-mono text-[14.5px] font-semibold">{fromRawAmount(e.amount)}</div>
                    <div
                      className="text-[11.5px] font-semibold px-2.25 py-1 rounded-[5px]"
                      style={{ background: "rgba(255,255,255,0.05)", color: status.color }}
                    >
                      {status.label}
                    </div>
                    {needsYourReview && (
                      <button
                        onClick={() => onOpenExpense(e.id)}
                        className="bg-transparent border border-accent text-accent rounded-md px-3 py-1.75 font-semibold text-[12.5px] cursor-pointer hover:bg-accent hover:text-bg transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
