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

export const KNOWN_TOKENS = [
  { symbol: TOKEN_SYMBOL, contractId: TOKEN_CONTRACT_ID },
  { symbol: "XLM", contractId: XLM_CONTRACT_ID },
];
