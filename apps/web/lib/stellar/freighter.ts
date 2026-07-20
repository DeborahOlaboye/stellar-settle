import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
  signAuthEntry,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./config";

export class FreighterNotInstalledError extends Error {
  constructor() {
    super("Freighter wallet extension not found");
    this.name = "FreighterNotInstalledError";
  }
}

export async function connectFreighter(): Promise<string> {
  const { isConnected: installed } = await isConnected();
  if (!installed) throw new FreighterNotInstalledError();

  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message ?? "Freighter access denied");
  return access.address;
}

export async function currentAddress(): Promise<string | null> {
  const { isConnected: installed } = await isConnected();
  if (!installed) return null;
  const result = await getAddress();
  if (result.error || !result.address) return null;
  return result.address;
}

/** Matches the `signTransaction` shape expected by the generated contract clients. */
export async function signTransactionWithFreighter(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) {
  const result = await signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    address: opts?.address,
  });
  if (result.error) throw new Error(result.error.message ?? "Freighter rejected the transaction");
  return result;
}

/** Signs a single Soroban auth entry, so each debtor can authorize their own
 * transfer without owning the transaction's source account. Matches the
 * `SignAuthEntry` shape expected by the generated contract clients. */
export async function signAuthEntryWithFreighter(
  entryXdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) {
  const result = await signAuthEntry(entryXdr, {
    networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    address: opts?.address,
  });
  if (result.error) throw new Error(result.error.message ?? "Freighter rejected the signature");
  return {
    signedAuthEntry: Buffer.isBuffer(result.signedAuthEntry)
      ? result.signedAuthEntry.toString("base64")
      : (result.signedAuthEntry ?? ""),
    signerAddress: result.signerAddress,
  };
}
