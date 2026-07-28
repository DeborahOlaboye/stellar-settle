import { fetchTokenSymbol } from "./queries";

// Module-level (not React state) since a token's symbol never changes and
// every route independently needs it — no reason to refetch per-page-visit.
const cache = new Map<string, string>();

export async function symbolFor(tokenId: string): Promise<string> {
  const cached = cache.get(tokenId);
  if (cached) return cached;
  const raw = await fetchTokenSymbol(null, tokenId);
  // The native XLM SAC's symbol() call returns the classic asset code
  // "native", not "XLM" — display the name people actually recognize.
  const symbol = raw === "native" ? "XLM" : raw;
  cache.set(tokenId, symbol);
  return symbol;
}
