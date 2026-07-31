"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import { connectFreighter, currentAddress, FreighterNotInstalledError } from "./freighter";

type WalletState = {
  address: string | null;
  connecting: boolean;
  checking: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
  /** Re-syncs to whatever account is currently active in Freighter, without
   * a full disconnect/reconnect. Switching accounts still has to happen
   * inside the Freighter extension itself (a dApp can't do that for
   * security reasons) — this just picks up that change immediately instead
   * of leaving the app pointed at a stale address, which otherwise produces
   * a confusing signature-mismatch failure the next time something signs. */
  switchWallet: () => Promise<string>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(true);

  // Restores the connection across page loads/refreshes — Freighter
  // remembers site permission, so this doesn't need a fresh user gesture.
  useEffect(() => {
    currentAddress()
      .then((addr) => setAddress(addr))
      .finally(() => setChecking(false));
  }, []);

  async function connect(): Promise<string> {
    setConnecting(true);
    try {
      const addr = await connectFreighter();
      setAddress(addr);
      track("wallet_connected", { address: addr });
      return addr;
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
  }

  return (
    <WalletContext.Provider value={{ address, connecting, checking, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}

export { FreighterNotInstalledError };
