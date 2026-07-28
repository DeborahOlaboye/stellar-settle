export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;
export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
export const SETTLEMENT_CONTRACT_ID = process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT_ID!;
export const TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID!;
export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "SETL";

// Stellar classic assets (which the demo token wraps) always use 7 decimals.
export const TOKEN_DECIMALS = 7;

// The native XLM asset's Stellar Asset Contract address on testnet — every
// asset (including XLM) reaches Soroban contracts through a SAC, which has
// its own C... contract address distinct from the G... account/issuer
// address. Derived via `stellar contract id asset --asset native --network testnet`.
export const XLM_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// XLM is the primary settlement token: every testnet account already holds
// it (funded via Friendbot), so there's no separate "mint a demo token"
// step for new users. The SETL demo token still works as a fallback via
// "Other..." in the picker (paste TOKEN_CONTRACT_ID), it's just not a preset.
export const KNOWN_TOKENS = [{ symbol: "XLM", contractId: XLM_CONTRACT_ID }];

export function explorerTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export function explorerContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

export function explorerAccountUrl(address: string): string {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}
