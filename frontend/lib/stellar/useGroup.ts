"use client";

import { useEffect, useState } from "react";
import { useWallet } from "./WalletContext";
import { fetchGroup, type Group } from "./queries";
import { symbolFor } from "./symbolCache";

/** Fetches a group and its token symbol for any page keyed off a group ID
 * route param — shared across the group detail, log-expense, confirm-expense,
 * and settle pages so each doesn't refetch/redefine this independently. */
export function useGroup(groupId: bigint | null) {
  const { address } = useWallet();
  const [group, setGroup] = useState<Group | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || groupId === null) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the loading flag when groupId changes
    setLoading(true);
    (async () => {
      try {
        const g = await fetchGroup(address, groupId);
        const symbol = await symbolFor(g.token);
        if (!cancelled) {
          setGroup(g);
          setTokenSymbol(symbol);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, groupId]);

  return { group, tokenSymbol, loading, error };
}
