"use client";

import { useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { XLM_CONTRACT_ID, KNOWN_TOKENS } from "@/lib/stellar/config";
import { truncateAddress } from "@/lib/stellar/format";

export function CreateGroupModal({
  walletAddress,
  onClose,
  onCreate,
}: {
  walletAddress: string;
  onClose: () => void;
  onCreate: (args: { name: string; token: string; members: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [token, setToken] = useState(XLM_CONTRACT_ID);
  const [customToken, setCustomToken] = useState(false);
  const [addressesText, setAddressesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Give the group a name");
      return;
    }
    if (!StrKey.isValidContract(token)) {
      setError("Settlement token must be a Soroban contract address (starts with C), not an asset code");
      return;
    }

    const entered = addressesText
      .split(/[\n,]/)
      .map((a) => a.trim())
      .filter(Boolean);
    for (const addr of entered) {
      if (!StrKey.isValidEd25519PublicKey(addr)) {
        setError(`"${addr}" isn't a valid Stellar address`);
        return;
      }
    }
    const members = Array.from(new Set([walletAddress, ...entered]));
    if (members.length < 2) {
      setError("Add at least one other member's address");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), token, members });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-panel border border-border rounded-2xl p-6.5 w-full max-w-[400px] flex flex-col gap-4">
        <div className="text-lg font-bold">New group</div>

        <div>
          <div className="text-xs text-text-dim mb-1.5">Group name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tokyo Offsite"
            className="w-full bg-panel-alt border border-border rounded-lg px-3.5 py-2.5 text-text text-sm outline-none focus:border-border-strong"
          />
        </div>

        <div>
          <div className="text-xs text-text-dim mb-1.5">Settlement token</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {KNOWN_TOKENS.map((t) => (
              <button
                key={t.contractId}
                type="button"
                onClick={() => {
                  setCustomToken(false);
                  setToken(t.contractId);
                }}
                className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold cursor-pointer ${
                  !customToken && token === t.contractId
                    ? "bg-accent text-bg"
                    : "bg-transparent border border-border-strong text-text-dim hover:border-accent hover:text-accent"
                }`}
              >
                {t.symbol}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomToken(true)}
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold cursor-pointer ${
                customToken
                  ? "bg-accent text-bg"
                  : "bg-transparent border border-border-strong text-text-dim hover:border-accent hover:text-accent"
              }`}
            >
              Other…
            </button>
          </div>

          {customToken ? (
            <>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={XLM_CONTRACT_ID}
                className="w-full bg-panel-alt border border-border rounded-lg px-3.5 py-2.5 text-text font-mono text-[13px] outline-none focus:border-border-strong"
              />
              <div className="text-[11px] text-text-faint mt-1.5">
                Paste a Soroban token contract address (starts with C) — every asset, including
                XLM, reaches Soroban through its Stellar Asset Contract, which has a different
                address from the G... account/issuer address.
              </div>
            </>
          ) : (
            <div className="text-[11px] text-text-faint mt-1.5">
              Every member&apos;s account needs an XLM balance to settle — funded automatically by
              Friendbot on testnet.{" "}
              <span className="font-mono">{truncateAddress(token)}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-text-dim mb-1.5">Other members&apos; Stellar addresses</div>
          <textarea
            value={addressesText}
            onChange={(e) => setAddressesText(e.target.value)}
            placeholder="One G... address per line"
            rows={3}
            className="w-full bg-panel-alt border border-border rounded-lg px-3.5 py-2.5 text-text font-mono text-[13px] outline-none resize-none focus:border-border-strong"
          />
          <div className="text-[11px] text-text-faint mt-1.5">You&apos;ll be added automatically.</div>
        </div>

        {error && <div className="text-[13px] text-negative">{error}</div>}

        <div className="flex gap-2.5 mt-1">
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="flex-1 bg-accent text-bg rounded-lg py-3 font-semibold text-sm cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-default"
          >
            {submitting ? "Creating…" : "Create group"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-transparent border border-border-strong text-text-dim rounded-lg py-3 font-semibold text-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
