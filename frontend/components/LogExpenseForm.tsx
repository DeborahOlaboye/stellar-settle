"use client";

import { useMemo, useState } from "react";
import { Group } from "@/lib/stellar/queries";
import { toRawAmount, fromRawAmount, truncateAddress } from "@/lib/stellar/format";

export function LogExpenseForm({
  group,
  tokenSymbol,
  walletAddress,
  onBack,
  onSubmit,
}: {
  group: Group;
  tokenSymbol: string;
  walletAddress: string;
  onBack: () => void;
  onSubmit: (args: { payer: string; amount: bigint; description: string; participants: string[] }) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(walletAddress);
  const [checked, setChecked] = useState<Set<string>>(
    new Set(group.members.filter((m) => m !== walletAddress)),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eligibleParticipants = group.members.filter((m) => m !== payer);

  function togglePayer(id: string) {
    setPayer(id);
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleParticipant(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // The payer is included in `participants` alongside everyone splitting the
  // bill — the contract computes an equal share for them too, and when they
  // later confirm their own share it's a net-zero balance change (they can't
  // owe or be owed by themselves). That gives everyone, including the payer,
  // an explicit confirm step and a complete on-chain record, instead of the
  // payer's portion being invisible bookkeeping.
  const split = useMemo(() => {
    const others = eligibleParticipants.filter((m) => checked.has(m));
    if (!amount || Number(amount) <= 0 || others.length === 0) return null;

    let totalRaw: bigint;
    try {
      totalRaw = toRawAmount(amount);
    } catch {
      return null;
    }
    if (totalRaw <= 0n) return null;

    const participants = [payer, ...others];
    const base = totalRaw / BigInt(participants.length);
    const remainder = totalRaw % BigInt(participants.length);
    const shares = participants.map((address, idx) => ({
      address,
      amount: fromRawAmount(base + (BigInt(idx) < remainder ? 1n : 0n)),
    }));

    return { participants, totalRaw, shares };
  }, [amount, payer, checked, eligibleParticipants]);

  async function handleSubmit() {
    setError(null);
    if (!description.trim() || !amount || Number(amount) <= 0) {
      setError("Enter a description and amount");
      return;
    }
    if (!split) {
      setError("Select at least one other participant to split with");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        payer,
        amount: split.totalRaw,
        description: description.trim(),
        participants: split.participants,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div onClick={onBack} className="font-mono text-[13px] text-text-faint cursor-pointer mb-3.5 hover:text-text-dim w-fit">
        &larr; {group.name}
      </div>
      <h1 className="m-0 mb-5.5 text-[26px] font-bold">Log an expense</h1>

      <div className="max-w-[480px] flex flex-col gap-4.5">
        <div>
          <div className="text-[13px] text-text-dim mb-1.75">Description</div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Cervejaria"
            className="w-full bg-panel border border-border rounded-lg px-3.5 py-3 text-text text-[14.5px] outline-none focus:border-border-strong"
          />
        </div>

        <div>
          <div className="text-[13px] text-text-dim mb-1.75">Total amount ({tokenSymbol})</div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="w-full bg-panel border border-border rounded-lg px-3.5 py-3 text-text font-mono text-[14.5px] outline-none focus:border-border-strong"
          />
        </div>

        <div>
          <div className="text-[13px] text-text-dim mb-1.75">Paid by</div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <button
                key={m}
                onClick={() => togglePayer(m)}
                className={`px-3.5 py-2.25 rounded-full text-[13.5px] font-semibold cursor-pointer ${
                  payer === m
                    ? "bg-accent text-bg"
                    : "bg-transparent border border-border-strong text-text-dim hover:border-accent hover:text-accent"
                }`}
              >
                {m === walletAddress ? "You" : truncateAddress(m)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[13px] text-text-dim mb-1.75">Split equally among</div>
          <div className="flex flex-col gap-2">
            {eligibleParticipants.map((m) => (
              <div
                key={m}
                onClick={() => toggleParticipant(m)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-panel border border-border cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded flex-none ${checked.has(m) ? "bg-accent" : "border border-border-strong"}`}
                />
                <div className="text-sm">{m === walletAddress ? "You" : truncateAddress(m)}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-text-faint mt-2 leading-[1.5]">
            The total is split evenly across everyone including the payer, and everyone — payer
            included — confirms their own share before it counts as settled.
          </div>
        </div>

        {split && (
          <div className="bg-panel border border-border rounded-[10px] px-4 py-3.5">
            <div className="text-xs text-text-faint mb-2">Per-person share</div>
            {split.shares.map((p) => (
              <div key={p.address} className="flex justify-between font-mono text-[13px] py-0.75">
                <div className="text-text-dim">
                  {p.address === walletAddress ? "You" : truncateAddress(p.address)}
                  {p.address === payer ? " (payer)" : ""}
                </div>
                <div>{p.amount}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-[13px] text-negative">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-accent text-bg rounded-lg px-5.5 py-3.5 font-semibold text-[15px] cursor-pointer mt-1 hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          {submitting ? "Logging…" : "Log expense"}
        </button>
      </div>
    </div>
  );
}
