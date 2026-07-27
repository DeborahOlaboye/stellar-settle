import { Avatar } from "./ui/Avatar";
import { fromRawAmount } from "@/lib/stellar/format";
import type { GroupSummary } from "@/lib/appTypes";

export function GroupsDashboard({
  groups,
  loading,
  walletAddress,
  onOpen,
  onCreateGroup,
}: {
  groups: GroupSummary[];
  loading: boolean;
  walletAddress: string;
  onOpen: (id: bigint) => void;
  onCreateGroup: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h1 className="m-0 text-[28px] font-bold">Groups</h1>
        <button
          onClick={onCreateGroup}
          className="bg-accent text-bg rounded-lg px-4.5 py-2.75 font-semibold text-sm cursor-pointer hover:bg-accent-hover transition-colors"
        >
          + New group
        </button>
      </div>

      {loading && <div className="text-text-dim text-sm">Loading groups…</div>}

      {!loading && groups.length === 0 && (
        <div className="bg-panel border border-dashed border-border-strong rounded-xl px-5 py-6 text-center text-text-faint text-[13.5px]">
          No groups yet — create one to start splitting expenses.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {groups.map((g) => {
          const isZero = g.yourBalance === 0n;
          const positive = g.yourBalance > 0n;
          return (
            <div
              key={g.id.toString()}
              onClick={() => onOpen(g.id)}
              className="bg-panel border border-border hover:border-[#463A54] rounded-xl px-5.5 py-5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex">
                  {g.members.slice(0, 4).map((m) => (
                    <Avatar key={m} address={m} isYou={m === walletAddress} size={34} overlap />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold">{g.name}</div>
                    {g.pendingReviewCount > 0 && (
                      <div className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-accent text-bg">
                        {g.pendingReviewCount} to review
                      </div>
                    )}
                  </div>
                  <div className="text-[13px] text-text-faint mt-0.5">
                    {g.members.length} members &middot; {g.tokenSymbol}
                  </div>
                </div>
              </div>
              <div
                className="font-mono text-[15px] font-semibold"
                style={{ color: isZero ? "#9C93A8" : positive ? "#4FD1C5" : "#E8567A" }}
              >
                {isZero ? "Settled up" : `${positive ? "+" : ""}${fromRawAmount(g.yourBalance)} ${g.tokenSymbol}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
