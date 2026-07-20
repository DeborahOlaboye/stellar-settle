export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE!;
export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
export const SETTLEMENT_CONTRACT_ID = process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT_ID!;
export const TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID!;
export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "SETL";

// Stellar classic assets (which the demo token wraps) always use 7 decimals.
export const TOKEN_DECIMALS = 7;
