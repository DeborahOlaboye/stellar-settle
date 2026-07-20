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
