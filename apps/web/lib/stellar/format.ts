import { TOKEN_DECIMALS } from "./config";

const AVATAR_COLORS = ["#4FD1C5", "#E0B44A", "#7C8CF8", "#E8734A", "#E8567A", "#6BE0D6"];

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}···${address.slice(-4)}`;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return initials.toUpperCase();
}

export function colorForAddress(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Converts a user-entered decimal amount (e.g. "68.40") to the token's raw i128 units. */
export function toRawAmount(amount: string, decimals: number = TOKEN_DECIMALS): bigint {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole, frac = ""] = unsigned.split(".");
  const paddedFrac = (frac + "0".repeat(decimals)).slice(0, decimals);
  const raw = BigInt((whole || "0") + paddedFrac || "0");
  return negative ? -raw : raw;
}

/** Converts a raw i128 token amount to a decimal string for display. */
export function fromRawAmount(raw: bigint, decimals: number = TOKEN_DECIMALS): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = (abs % divisor).toString().padStart(decimals, "0").slice(0, 2);
  return `${negative ? "-" : ""}${whole}.${frac}`;
}
