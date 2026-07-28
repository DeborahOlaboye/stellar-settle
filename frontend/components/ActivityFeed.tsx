import { fromRawAmount, truncateAddress } from "@/lib/stellar/format";
import { explorerTxUrl } from "@/lib/stellar/config";
import type { ActivityEvent } from "@/lib/stellar/activity";
import type { Expense } from "@/lib/stellar/queries";

function describe(
  event: ActivityEvent,
  tokenSymbol: string,
  walletAddress: string,
  expenseById: Map<string, Expense>,
): string {
  const who = (addr: string) => (addr === walletAddress ? "You" : truncateAddress(addr));
  const expenseLabel = (id: bigint) => {
    const e = expenseById.get(id.toString());
    return e ? `"${e.description}"` : `expense #${id}`;
  };

  switch (event.type) {
    case "group_created":
      return `${who(event.creator)} created this group`;
    case "expense_logged":
      return `${who(event.payer)} logged ${expenseLabel(event.expenseId)} — ${fromRawAmount(event.amount)} ${tokenSymbol}`;
    case "expense_confirmed":
      return `${who(event.participant)} confirmed their share of ${expenseLabel(event.expenseId)}`;
    case "expense_disputed":
      return `${who(event.participant)} disputed their share of ${expenseLabel(event.expenseId)}`;
    case "settled":
      return `${who(event.from)} → ${who(event.to)} · ${fromRawAmount(event.amount)} ${tokenSymbol}`;
  }
}

export function ActivityFeed({
  events,
  loading,
  tokenSymbol,
  walletAddress,
  expenses,
}: {
  events: ActivityEvent[];
  loading: boolean;
  tokenSymbol: string;
  walletAddress: string;
  expenses: Expense[];
}) {
  if (loading) return <div className="text-text-dim text-sm">Loading activity…</div>;
  if (events.length === 0) return null;

  const expenseById = new Map(expenses.map((e) => [e.id.toString(), e]));

  return (
    <div className="mt-6.5">
      <div className="font-mono text-xs tracking-[1.5px] uppercase text-text-faint mb-3">Activity</div>
      <div className="flex flex-col gap-2">
        {events.map((e, i) => (
          <div
            key={`${e.txHash}-${i}`}
            className="bg-panel border border-border-soft rounded-lg px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="text-[13px]">{describe(e, tokenSymbol, walletAddress, expenseById)}</div>
            <a
              href={explorerTxUrl(e.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none font-mono text-xs text-accent hover:text-accent-hover"
            >
              {truncateAddress(e.txHash)}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
