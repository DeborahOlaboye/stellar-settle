"use client";

import { useState } from "react";
import { Group, Expense } from "@/lib/stellar/queries";
import { fromRawAmount, truncateAddress } from "@/lib/stellar/format";

export function ConfirmDisputeExpense({
  group,
  expense,
  tokenSymbol,
  walletAddress,
  onBack,
  onConfirm,
  onDispute,
}: {
  group: Group;
  expense: Expense;
  tokenSymbol: string;
  walletAddress: string;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  onDispute: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"confirm" | "dispute" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yourIndex = expense.participants.indexOf(walletAddress);
  const yourShare = yourIndex >= 0 ? expense.shares[yourIndex] : 0n;
  const isPayer = expense.payer === walletAddress;

  async function handle(action: "confirm" | "dispute") {
    setError(null);
    setBusy(action);
    try {
      await (action === "confirm" ? onConfirm() : onDispute());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div onClick={onBack} className="font-mono text-[13px] text-text-faint cursor-pointer mb-3.5 hover:text-text-dim w-fit">
        &larr; {group.name}
      </div>
      <h1 className="m-0 mb-1.5 text-[26px] font-bold">{expense.description}</h1>
      <div className="font-mono text-[13px] text-text-faint mb-6">
        Paid by {expense.payer === walletAddress ? "you" : truncateAddress(expense.payer)} &middot; total{" "}
        {fromRawAmount(expense.amount)} {tokenSymbol}
      </div>

      <div className="bg-panel border border-border rounded-xl px-5.5 py-5 mb-5">
        <div className="text-[13px] text-text-dim mb-1">Your share</div>
        <div className="font-mono text-[32px] font-semibold">
          {fromRawAmount(yourShare)} <span className="text-base text-text-faint">{tokenSymbol}</span>
        </div>
        {isPayer && (
          <div className="text-xs text-text-faint mt-2">
            You paid this expense, so confirming just acknowledges it — it won&apos;t change your balance.
            Only the other participants confirming theirs will.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-6.5">
        {expense.participants.map((p, idx) => {
          const status = expense.disputed.includes(p)
            ? { label: "Disputed", color: "#E8567A" }
            : expense.confirmed.includes(p)
              ? { label: "Confirmed", color: "#4FD1C5" }
              : { label: "Pending", color: "#E8734A" };
          return (
            <div
              key={p}
              className="flex items-center justify-between px-3.5 py-2.75 rounded-lg bg-panel border border-border-soft"
            >
              <div className="text-[13.5px] text-text">{p === walletAddress ? "You" : truncateAddress(p)}</div>
              <div className="flex items-center gap-3">
                <div className="font-mono text-[13px] text-text-dim">{fromRawAmount(expense.shares[idx])}</div>
                <div className="text-[11.5px] font-semibold" style={{ color: status.color }}>
                  {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="text-[13px] text-negative mb-3">{error}</div>}

      <div className="flex gap-3">
        <button
          onClick={() => handle("confirm")}
          disabled={busy !== null}
          className="flex-1 bg-positive text-bg rounded-lg px-5.5 py-3.5 font-semibold text-[14.5px] cursor-pointer hover:bg-positive-hover transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          {busy === "confirm" ? "Confirming…" : isPayer ? "Confirm — acknowledge this expense" : "Confirm — I owe this"}
        </button>
        <button
          onClick={() => handle("dispute")}
          disabled={busy !== null}
          className="flex-1 bg-transparent border border-negative text-negative rounded-lg px-5.5 py-3.5 font-semibold text-[14.5px] cursor-pointer hover:bg-negative hover:text-bg transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          {busy === "dispute" ? "Disputing…" : "Dispute"}
        </button>
      </div>
    </div>
  );
}
