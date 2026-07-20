import "server-only";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "./config";

/** A signTransaction adapter (matching the Freighter shape) backed by a raw
 * keypair, for server-side signing only — never import this in a client component. */
export function keypairSigner(secret: string) {
  const keypair = Keypair.fromSecret(secret);
  return async (xdr: string, opts?: { networkPassphrase?: string }) => {
    const tx = TransactionBuilder.fromXDR(xdr, opts?.networkPassphrase ?? NETWORK_PASSPHRASE);
    tx.sign(keypair);
    return { signedTxXdr: tx.toXDR(), signerAddress: keypair.publicKey() };
  };
}
