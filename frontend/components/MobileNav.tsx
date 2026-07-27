import { truncateAddress } from "@/lib/stellar/format";

export function MobileNav({
  onNavGroups,
  walletAddress,
  onDisconnect,
}: {
  onNavGroups: () => void;
  walletAddress: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex md:hidden items-center justify-between gap-3 px-4 py-3 bg-sidebar border-b border-border-soft">
      <button onClick={onNavGroups} className="flex items-center gap-2 cursor-pointer">
        <div className="w-2 h-2 rounded-sm bg-accent flex-none" />
        <div className="font-mono text-[11px] tracking-[1.5px] uppercase">Settle</div>
      </button>

      <div className="flex items-center gap-2">
        <div className="font-mono text-[11px] text-text-dim">{truncateAddress(walletAddress)}</div>
        <button
          onClick={onDisconnect}
          className="bg-transparent border border-border-strong text-text-dim rounded-md px-2 py-1 text-[11px] cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
