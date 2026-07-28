import { fromRawAmount, truncateAddress } from "@/lib/stellar/format";
import { explorerTxUrl } from "@/lib/stellar/config";
import type { SettlementEvent } from "@/lib/stellar/settlementHistory";

export function SettlementHistory({
  events,
  loading,
  tokenSymbol,
  walletAddress,
}: {
  events: SettlementEvent[];
  loading: boolean;
  tokenSymbol: string;
  walletAddress: string;
}) {
  if (loading) return <div className="text-text-dim text-sm">Loading settlement history…</div>;
  if (events.length === 0) return null;

  return (
    <div className="mt-6.5">
      <div className="font-mono text-xs tracking-[1.5px] uppercase text-text-faint mb-3">
        Settlement history
      </div>
      <div className="flex flex-col gap-2">
        {events.map((e, i) => (
          <div
            key={`${e.txHash}-${i}`}
            className="bg-panel border border-border-soft rounded-lg px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="text-[13px]">
              <span className="font-medium">{e.from === walletAddress ? "You" : truncateAddress(e.from)}</span>
              <span className="text-text-faint"> &rarr; </span>
              <span className="font-medium">{e.to === walletAddress ? "You" : truncateAddress(e.to)}</span>
              <span className="text-text-faint font-mono text-xs">
                {" "}
                &middot; {fromRawAmount(e.amount)} {tokenSymbol}
              </span>
            </div>
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
