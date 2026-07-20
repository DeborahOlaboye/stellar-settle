import { Avatar } from "./ui/Avatar";
import { fromRawAmount, truncateAddress } from "@/lib/stellar/format";
import type { Transfer } from "@/lib/stellar/queries";

export function SettlementPreview({
  groupName,
  tokenSymbol,
  transfers,
  loading,
  walletAddress,
  onCancel,
  onConfirmSettle,
  submitting,
}: {
  groupName: string;
  tokenSymbol: string;
  transfers: Transfer[];
  loading: boolean;
  walletAddress: string;
  onCancel: () => void;
  onConfirmSettle: () => void;
  submitting: boolean;
}) {
  const youAreDebtor = transfers.some((t) => t.from === walletAddress);

  return (
    <div>
      <div onClick={onCancel} className="font-mono text-[13px] text-text-faint cursor-pointer mb-3.5 hover:text-text-dim w-fit">
        &larr; {groupName}
      </div>
      <h1 className="m-0 mb-2 text-[26px] font-bold">Settle up</h1>
      <p className="m-0 mb-6 text-sm text-text-dim max-w-[480px] leading-[1.55]">
        Minimal transfer set computed from current balances &mdash; the smallest number of on-chain
        transfers that clears every debt.
      </p>

      {loading ? (
        <div className="text-text-dim text-sm mb-5">Computing settlement…</div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-5">
          {transfers.map((t, i) => (
            <div
              key={i}
              className="bg-panel border border-border rounded-xl px-5 py-4.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar address={t.from} isYou={t.from === walletAddress} size={30} />
                <div className="text-sm font-medium">{t.from === walletAddress ? "You" : truncateAddress(t.from)}</div>
                <div className="text-text-faint text-[15px]">&rarr;</div>
                <Avatar address={t.to} isYou={t.to === walletAddress} size={30} />
                <div className="text-sm font-medium">{t.to === walletAddress ? "You" : truncateAddress(t.to)}</div>
              </div>
              <div className="font-mono text-[15px] font-semibold">
                {fromRawAmount(t.amount)} {tokenSymbol}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="font-mono text-xs text-text-faint mb-6.5">
        Est. network fee: &lt;$0.001 per transfer &middot; executed atomically
      </div>

      {youAreDebtor && (
        <div className="text-[13px] text-accent mb-4.5">
          You&apos;ll be asked to sign in Freighter to authorize your transfer.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onConfirmSettle}
          disabled={loading || submitting || transfers.length === 0}
          className="bg-accent text-bg rounded-lg px-5.5 py-3.5 font-semibold text-[14.5px] cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          {submitting ? "Preparing…" : "Confirm & settle"}
        </button>
        <button
          onClick={onCancel}
          className="bg-transparent border border-border-strong text-text-dim rounded-lg px-5.5 py-3.5 font-semibold text-[14.5px] cursor-pointer hover:border-[#463A54] hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
