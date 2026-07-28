"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useWallet } from "@/lib/stellar/WalletContext";

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { address, checking, disconnect } = useWallet();

  useEffect(() => {
    if (!checking && !address) router.replace("/");
  }, [checking, address, router]);

  function handleDisconnect() {
    disconnect();
    router.replace("/");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-text-dim text-sm">
        Checking wallet connection…
      </div>
    );
  }

  if (!address) return null;

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar onNavGroups={() => router.push("/groups")} walletAddress={address} onDisconnect={handleDisconnect} />
      <MobileNav onNavGroups={() => router.push("/groups")} walletAddress={address} onDisconnect={handleDisconnect} />
      <div className="flex-1 min-w-0 px-5 py-6 sm:px-12 sm:py-10">
        <div className="max-w-[860px]">{children}</div>
      </div>
    </div>
  );
}
