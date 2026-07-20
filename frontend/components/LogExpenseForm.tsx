"use client";

import { useMemo, useState } from "react";
import { Group } from "@/lib/stellar/queries";
import { toRawAmount, truncateAddress } from "@/lib/stellar/format";

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

  const preview = useMemo(() => {
    const amt = Number(amount);
    const participants = eligibleParticipants.filter((m) => checked.has(m));
    if (!amt || amt <= 0 || participants.length === 0) return null;
    const cents = Math.round(amt * 100);
    const base = Math.floor(cents / participants.length);
    const remainder = cents - base * participants.length;
    return participants.map((m, idx) => ({
      address: m,
      amount: ((base + (idx < remainder ? 1 : 0)) / 100).toFixed(2),
    }));
  }, [amount, checked, eligibleParticipants]);

  async function handleSubmit() {
    setError(null);
    const amt = Number(amount);
    if (!description.trim() || !amt || amt <= 0) {
      setError("Enter a description and amount");
      return;
    }
    const participants = eligibleParticipants.filter((m) => checked.has(m));
    if (participants.length === 0) {
      setError("Select at least one participant who owes a share");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        payer,
        amount: toRawAmount(amount),
        description: description.trim(),
        participants,
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
          <div className="text-[13px] text-text-dim mb-1.75">Amount owed to the payer ({tokenSymbol})</div>
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
            Shares are split evenly; any remainder cent goes to the earliest participants so shares
            always sum exactly to the amount.
          </div>
        </div>

        {preview && (
          <div className="bg-panel border border-border rounded-[10px] px-4 py-3.5">
            <div className="text-xs text-text-faint mb-2">Per-person share</div>
            {preview.map((p) => (
              <div key={p.address} className="flex justify-between font-mono text-[13px] py-0.75">
                <div className="text-text-dim">{p.address === walletAddress ? "You" : truncateAddress(p.address)}</div>
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
