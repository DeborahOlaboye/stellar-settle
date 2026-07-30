import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import type { Transfer } from "settlement-client";
import { createSettlementClient } from "./clients";
import { signAuthEntryWithFreighter } from "./freighter";

export type SettleTx = AssembledTransaction<Transfer[]>;

export async function buildSettleTransaction(publicKey: string, groupId: bigint): Promise<SettleTx> {
  const client = createSettlementClient(publicKey);
  return client.settle({ group_id: groupId, caller: publicKey });
}

/** Addresses (other than the connected wallet) that still need to authorize this settlement. */
export function pendingSigners(tx: SettleTx): string[] {
  return tx.needsNonInvokerSigningBy();
}

/** Signs every auth entry for one debtor. In the demo, switch Freighter's
 * active account to this address before calling. */
export async function signSettlementAs(tx: SettleTx, address: string): Promise<void> {
  await tx.signAuthEntries({
    address,
    signAuthEntry: (entryXdr, opts) => signAuthEntryWithFreighter(entryXdr, { ...opts, address }),
  });
}

export async function submitSettlement(tx: SettleTx): Promise<{ txHash: string; transfers: Transfer[] }> {
  const sent = await tx.signAndSend();
  return {
    txHash: sent.sendTransactionResponse?.hash ?? "unknown",
    transfers: sent.result,
  };
}

/** Formats a settle-flow error for display, while always logging full
 * diagnostics (message, stack, and what step/address it happened on) to the
 * console — real Soroban errors already carry a useful message and are
 * shown as-is, but an unexpected client-side crash (e.g. a raw TypeError)
 * gets a message pointing at the console instead of leaking something like
 * "Cannot read properties of undefined (reading 'switch')" verbatim. */
export function describeSettleError(
  err: unknown,
  context: { step: "sign" | "submit"; address?: string; debtors: string[]; groupId: bigint },
): string {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  console.error("[settle error]", { ...context, message, stack, error: err });

  if (message.includes("HostError") || message.includes("Error(")) {
    return message;
  }

  return `Something unexpected went wrong (${message}). Open the browser console for full details and please report this — it's a bug, not something a retry will usually fix.`;
}
