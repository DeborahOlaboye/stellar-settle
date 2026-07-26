import { truncateAddress } from "@/lib/stellar/format";

export function MobileNav({
  active,
  onNavGroups,
  onNavCashout,
  walletAddress,
  onDisconnect,
}: {
  active: "groups" | "cashout";
  onNavGroups: () => void;
  onNavCashout: () => void;
  walletAddress: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex md:hidden items-center justify-between gap-3 px-4 py-3 bg-sidebar border-b border-border-soft">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-sm bg-accent flex-none" />
        <div className="font-mono text-[11px] tracking-[1.5px] uppercase">Settle</div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onNavGroups}
          className={`px-2.5 py-1.5 rounded-md text-xs cursor-pointer ${
            active === "groups" ? "bg-border-soft text-text font-semibold" : "text-text-dim font-medium"
          }`}
        >
          Groups
        </button>
        <button
          onClick={onNavCashout}
          className={`px-2.5 py-1.5 rounded-md text-xs cursor-pointer ${
            active === "cashout" ? "bg-border-soft text-text font-semibold" : "text-text-dim font-medium"
          }`}
        >
          Cash out
        </button>
      </div>

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
