import { Client as SettlementClient } from "settlement-client";
import { Client as TokenClient } from "token-client";
import { NETWORK_PASSPHRASE, RPC_URL, SETTLEMENT_CONTRACT_ID, TOKEN_CONTRACT_ID } from "./config";
import { signTransactionWithFreighter, signAuthEntryWithFreighter } from "./freighter";

/** Bound to the connected wallet: reads simulate freely, writes prompt Freighter. */
export function createSettlementClient(publicKey: string | null) {
  return new SettlementClient({
    contractId: SETTLEMENT_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: publicKey ?? undefined,
    signTransaction: signTransactionWithFreighter,
    signAuthEntry: signAuthEntryWithFreighter,
  });
}

export function createTokenClient(publicKey: string | null) {
  return new TokenClient({
    contractId: TOKEN_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: publicKey ?? undefined,
    signTransaction: signTransactionWithFreighter,
    signAuthEntry: signAuthEntryWithFreighter,
  });
}
