import { truncateAddress } from "@/lib/stellar/format";
import { track } from "@vercel/analytics";

const FEEDBACK_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ||
  "https://docs.google.com/forms/d/e/1FAIpQLSeaFS7Um-dxvSLKnls-A1NMGxn9PCJOzIC8_3GfqzZ4lVXihw/viewform";

export function Sidebar({
  onNavGroups,
  walletAddress,
  onDisconnect,
}: {
  onNavGroups: () => void;
  walletAddress: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="hidden md:flex w-[250px] flex-none bg-sidebar border-r border-border-soft flex-col p-4.5 min-h-screen">
      <div className="flex items-center gap-2.5 px-2 pb-7">
        <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
        <div className="font-mono text-[12.5px] tracking-[1.5px] uppercase">Stellar Settle</div>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={onNavGroups}
          className="text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm cursor-pointer bg-border-soft text-text font-semibold"
        >
          Groups
        </button>
      </div>

      <div className="flex-1" />

      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("feedback_link_clicked")}
        className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-lg text-sm text-text-dim font-medium hover:bg-[#1C1723] hover:text-text transition-colors"
      >
        Send feedback
      </a>

      <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#4FD1C5", animation: "pulse 2s ease infinite" }}
        />
        <div className="font-mono text-[11px] text-text-faint tracking-[0.5px]">TESTNET</div>
      </div>
      <div className="bg-panel border border-border rounded-[10px] p-3 flex flex-col gap-2">
        <div className="font-mono text-[12.5px]">{truncateAddress(walletAddress)}</div>
        <button
          onClick={onDisconnect}
          className="bg-transparent border border-border-strong text-text-dim rounded-md px-2.5 py-1.5 text-xs cursor-pointer hover:border-negative hover:text-negative transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
