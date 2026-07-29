import { rpc } from "@stellar/stellar-sdk";
import { Client as SettlementClient } from "settlement-client";
import { Client as TokenClient } from "token-client";
import { NETWORK_PASSPHRASE, RPC_URL, SETTLEMENT_CONTRACT_ID, TOKEN_CONTRACT_ID } from "./config";
import { signTransactionWithFreighter, signAuthEntryWithFreighter } from "./freighter";

/**
 * The generated client's default simulation calls the RPC in plain "record"
 * auth mode, which only records auth requirements rooted at the top-level
 * invocation. settle() requires from.require_auth() inside a *nested* call
 * (settle -> token.transfer), so plain "record" mode fails with
 * "encountered authorization not tied to the root contract invocation" and
 * needsNonInvokerSigningBy() silently comes back empty instead of listing
 * the debtor. "record_allow_nonroot" is the mode meant for exactly this.
 */
class NonRootAuthServer extends rpc.Server {
  simulateTransaction(
    tx: Parameters<rpc.Server["simulateTransaction"]>[0],
    addlResources?: Parameters<rpc.Server["simulateTransaction"]>[1],
  ) {
    return super.simulateTransaction(tx, addlResources, "record_allow_nonroot");
  }
}

const nonRootAuthServer = new NonRootAuthServer(RPC_URL);

/** Bound to the connected wallet: reads simulate freely, writes prompt Freighter. */
export function createSettlementClient(publicKey: string | null) {
  return new SettlementClient({
    contractId: SETTLEMENT_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    server: nonRootAuthServer,
    publicKey: publicKey ?? undefined,
    signTransaction: signTransactionWithFreighter,
    signAuthEntry: signAuthEntryWithFreighter,
  });
}

export function createTokenClient(publicKey: string | null, tokenId: string = TOKEN_CONTRACT_ID) {
  return new TokenClient({
    contractId: tokenId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: publicKey ?? undefined,
    signTransaction: signTransactionWithFreighter,
    signAuthEntry: signAuthEntryWithFreighter,
  });
}
