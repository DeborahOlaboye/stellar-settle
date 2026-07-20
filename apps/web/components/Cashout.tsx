"use client";

import { useState } from "react";
import { fromRawAmount } from "@/lib/stellar/format";

const ANCHORS = [
  { id: "moneygram", name: "MoneyGram Access", description: "Cash payout at MoneyGram locations", eta: "~10 min" },
  { id: "circle", name: "Circle Anchor", description: "Bank transfer via Circle", eta: "~1 business day" },
  { id: "vibrant", name: "Vibrant", description: "Mobile money, Latin America", eta: "~5 min" },
];

export function Cashout({
  tokenSymbol,
  tokenBalance,
  onBack,
}: {
  tokenSymbol: string;
  tokenBalance: bigint | null;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"form" | "redirecting" | "pending" | "complete">("form");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    if (!anchor || !amount) {
      setError("Choose an anchor and amount");
      return;
    }
    setStep("redirecting");
    setTimeout(() => {
      setStep("pending");
      setTimeout(() => {
        setRef("SEP24-" + Math.random().toString(36).slice(2, 8).toUpperCase());
        setStep("complete");
      }, 1800);
    }, 1200);
  }

  const selectedName = anchor ? ANCHORS.find((a) => a.id === anchor)?.name : "the anchor";

  return (
    <div>
      <div onClick={onBack} className="font-mono text-[13px] text-text-faint cursor-pointer mb-3.5 hover:text-text-dim w-fit">
        &larr; Groups
      </div>
      <h1 className="m-0 mb-2 text-[26px] font-bold">Cash out via anchor</h1>
      <p className="m-0 mb-2 text-sm text-text-dim max-w-[480px] leading-[1.55]">
        Withdraw settled funds from your Stellar wallet to a bank or mobile money account through a
        SEP-24 anchor.
      </p>
      <p className="m-0 mb-6 text-xs text-accent max-w-[480px] leading-[1.55]">
        Simulated in this testnet demo — real anchor integration is mainnet-vision scope.
      </p>

      {step === "form" && (
        <>
          <div className="font-mono text-xs text-text-faint mb-4">
            Available: {tokenBalance !== null ? fromRawAmount(tokenBalance) : "…"} {tokenSymbol} in your wallet
          </div>
          <div className="flex flex-col gap-2.5 mb-5 max-w-[480px]">
            {ANCHORS.map((a) => (
              <div
                key={a.id}
                onClick={() => setAnchor(a.id)}
                className={`rounded-[10px] px-4 py-3.5 cursor-pointer ${
                  anchor === a.id ? "bg-border-soft border border-accent" : "bg-panel border border-border hover:border-[#463A54]"
                }`}
              >
                <div className="text-[14.5px] font-semibold">{a.name}</div>
                <div className="text-[12.5px] text-text-dim mt-0.75">
                  {a.description} &middot; {a.eta}
                </div>
              </div>
            ))}
          </div>
          <div className="max-w-[480px] mb-5.5">
            <div className="text-[13px] text-text-dim mb-1.75">Amount to withdraw ({tokenSymbol})</div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full bg-panel border border-border rounded-lg px-3.5 py-3 text-text font-mono text-[14.5px] outline-none focus:border-border-strong"
            />
          </div>
          {error && <div className="text-[13px] text-negative mb-4">{error}</div>}
          <button
            onClick={start}
            className="bg-accent text-bg rounded-lg px-5.5 py-3.5 font-semibold text-[14.5px] cursor-pointer hover:bg-accent-hover transition-colors"
          >
            Start withdrawal via SEP-24
          </button>
        </>
      )}

      {(step === "redirecting" || step === "pending") && (
        <div className="flex items-center gap-3 bg-panel border border-border rounded-[10px] p-5 max-w-[480px]">
          <div
            className="w-4.5 h-4.5 rounded-full border-2 border-border-strong"
            style={{ borderTopColor: "#E8734A", animation: "spin .7s linear infinite" }}
          />
          <div className="text-sm text-text-dim">
            {step === "redirecting" ? `Redirecting to ${selectedName}'s hosted flow…` : "Waiting for anchor confirmation…"}
          </div>
        </div>
      )}

      {step === "complete" && (
        <div
          className="bg-panel border border-border rounded-[10px] p-5.5 max-w-[480px] flex flex-col gap-2.5"
          style={{ animation: "fadeUp .4s ease" }}
        >
          <div className="text-[15px] font-semibold text-positive">Withdrawal complete</div>
          <div className="font-mono text-[12.5px] text-text-dim">Reference {ref}</div>
          <button
            onClick={onBack}
            className="mt-2 bg-accent text-bg rounded-lg px-4.5 py-3 font-semibold text-sm cursor-pointer hover:bg-accent-hover transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
