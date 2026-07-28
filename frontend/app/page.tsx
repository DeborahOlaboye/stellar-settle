"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Landing } from "@/components/Landing";
import { useWallet, FreighterNotInstalledError } from "@/lib/stellar/WalletContext";
import { useToast } from "@/lib/ToastContext";

export default function Home() {
  const router = useRouter();
  const { address, checking, connecting, connect } = useWallet();
  const { showToast } = useToast();

  useEffect(() => {
    if (!checking && address) router.replace("/groups");
  }, [checking, address, router]);

  async function handleConnect() {
    try {
      await connect();
      router.push("/groups");
    } catch (err) {
      if (err instanceof FreighterNotInstalledError) {
        showToast("Install the Freighter wallet extension to continue");
      } else {
        showToast(err instanceof Error ? err.message : "Failed to connect wallet");
      }
    }
  }

  return <Landing connecting={connecting} onConnect={handleConnect} />;
}
