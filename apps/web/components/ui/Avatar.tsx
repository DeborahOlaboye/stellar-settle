import { colorForAddress, truncateAddress } from "@/lib/stellar/format";

export function addressInitials(address: string): string {
  // Skip the "G" account-type prefix so avatars differ across addresses.
  return address.slice(1, 3).toUpperCase();
}

export function Avatar({
  address,
  isYou,
  size = 32,
  overlap = false,
}: {
  address: string;
  isYou?: boolean;
  size?: number;
  overlap?: boolean;
}) {
  return (
    <div
      title={isYou ? "You" : truncateAddress(address)}
      className={`flex items-center justify-center rounded-full font-mono font-semibold text-bg ${overlap ? "-ml-2 border-2 border-panel first:ml-0" : ""}`}
      style={{
        width: size,
        height: size,
        background: isYou ? "#E8734A" : colorForAddress(address),
        fontSize: size * 0.35,
      }}
    >
      {isYou ? "YO" : addressInitials(address)}
    </div>
  );
}
