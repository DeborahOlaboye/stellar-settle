"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { truncateAddress } from "@/lib/stellar/format";
import { explorerTxUrl } from "@/lib/stellar/config";
import type { SettleTx } from "@/lib/stellar/settleFlow";
import { signSettlementAs, submitSettlement } from "@/lib/stellar/settleFlow";

function StepDot({ state }: { state: "done" | "active" | "pending"; label: string }) {
  if (state === "done") {
    return (
      <div className="w-7 h-7 rounded-full bg-positive text-bg flex items-center justify-center text-[15px] font-bold">
        ✓
      </div>
    );
  }
  if (state === "active") {
    return (
      <div
        className="w-7 h-7 rounded-full border-2 border-border-strong"
        style={{ borderTopColor: "#E8734A", animation: "spin .7s linear infinite" }}
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-border-soft border-2 border-border-strong text-text-faint flex items-center justify-center text-xs font-bold" />
  );
}

export function SettleStatus({
  groupName,
  tokenSymbol,
  transfersCount,
  tx,
  debtors,
  onDone,
}: {
  groupName: string;
  tokenSymbol: string;
  transfersCount: number;
  tx: SettleTx;
  debtors: string[];
  onDone: () => void;
}) {
  const [signed, setSigned] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"collecting" | "submitting" | "confirmed">(
    debtors.length === 0 ? "submitting" : "collecting",
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingAddress, setSigningAddress] = useState<string | null>(null);

  const allSigned = debtors.every((d) => signed.has(d));

  const submit = useCallback(async () => {
    setPhase("submitting");
    try {
      const { txHash } = await submitSettlement(tx);
      setTxHash(txHash);
      setPhase("confirmed");
      track("settlement_completed", { groupName, transfersCount, txHash });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
      setPhase("collecting");
    }
  }, [tx, groupName, transfersCount]);

  // If nobody besides the caller needs to sign (they were the only debtor),
  // there's no "Sign in Freighter" click to hang the submit off of — kick it
  // off directly instead of leaving the UI stuck showing "submitting" with
  // nothing actually submitting.
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (debtors.length === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit();
    }
  }, [debtors, submit]);

  async function handleSign(address: string) {
    setError(null);
    setSigningAddress(address);
    try {
      await signSettlementAs(tx, address);
      const next = new Set(signed);
      next.add(address);
      setSigned(next);
      if (debtors.every((d) => next.has(d))) {
        await submit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature failed");
    } finally {
      setSigningAddress(null);
    }
  }

  const isSubmitting = phase === "submitting";
  const isConfirmed = phase === "confirmed";

  return (
    <div>
      <h1 className="m-0 mb-1.5 text-[26px] font-bold">Settling {groupName}</h1>
      <div className="font-mono text-[13px] text-text-faint mb-7">
        {transfersCount} transfers &middot; {tokenSymbol}
      </div>

      <div className="flex flex-col">
        {/* step 1 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepDot state={isSubmitting || isConfirmed ? "done" : "active"} label="1" />
            <div className="w-0.5 flex-1 bg-border my-1" />
          </div>
          <div className="pb-6.5 flex-1">
            <div className="text-[15px] font-semibold mb-2.5">Collecting authorizations</div>
            {debtors.length === 0 ? (
              <div className="text-[13px] text-text-faint">No additional signatures needed.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {debtors.map((d) => (
                  <div
                    key={d}
                    className="flex items-center justify-between bg-panel border border-border rounded-lg px-3.5 py-2.5"
                  >
                    <div className="text-[13.5px]">{truncateAddress(d)}</div>
                    {signed.has(d) ? (
                      <div className="text-xs text-positive font-semibold">Signed</div>
                    ) : (
                      <button
                        onClick={() => handleSign(d)}
                        disabled={signingAddress !== null || isSubmitting || isConfirmed}
                        className="bg-accent text-bg rounded-md px-3 py-1.75 font-semibold text-xs cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-60"
                      >
                        {signingAddress === d ? "Waiting for Freighter…" : "Sign in Freighter"}
                      </button>
                    )}
                  </div>
                ))}
                {debtors.length > 1 && !allSigned && (
                  <div className="text-[11.5px] text-text-faint mt-1">
                    Switch Freighter&apos;s active account to each address above before signing for them.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* step 2 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepDot state={isConfirmed ? "done" : isSubmitting ? "active" : "pending"} label="2" />
            <div className="w-0.5 flex-1 bg-border my-1" />
          </div>
          <div className="pb-6.5 flex-1">
            <div
              className="text-[15px] font-semibold"
              style={{ color: isConfirmed ? "#4FD1C5" : isSubmitting ? "#F4F0EA" : "#726A82" }}
            >
              Submitting transaction to Stellar network
            </div>
          </div>
        </div>

        {/* step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepDot state={isConfirmed ? "done" : "pending"} label="3" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold mb-3" style={{ color: isConfirmed ? "#4FD1C5" : "#726A82" }}>
              Confirmed on ledger
            </div>
            {isConfirmed && (
              <div
                className="bg-panel border border-border rounded-[10px] px-4.5 py-4 flex flex-col gap-2.5"
                style={{ animation: "fadeUp .4s ease" }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-xs text-text-faint">Transaction hash</div>
                  <a
                    href={explorerTxUrl(txHash ?? "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12.5px] text-accent hover:text-accent-hover"
                  >
                    {truncateAddress(txHash ?? "")}
                  </a>
                </div>
                <div className="text-[13px] text-positive font-semibold">Balances settled &mdash; all debts cleared.</div>
                <button
                  onClick={onDone}
                  className="bg-accent text-bg rounded-lg px-4.5 py-3 font-semibold text-sm cursor-pointer hover:bg-accent-hover transition-colors mt-1.5"
                >
                  Back to group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-[13px] text-negative mt-2">{error}</div>}
    </div>
  );
}
