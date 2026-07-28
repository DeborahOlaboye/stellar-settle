import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { RPC_URL, SETTLEMENT_CONTRACT_ID } from "./config";

export type SettlementEvent = {
  txHash: string;
  ledgerClosedAt: string;
  from: string;
  to: string;
  amount: bigint;
};

const RETENTION_WINDOW_LEDGERS = 100_000; // public RPC retains roughly this much event history

/** Reads real "settled" transfer events emitted by the contract for a group,
 * so past settlements stay provable even after balances zero back out. */
export async function fetchSettlementHistory(groupId: bigint): Promise<SettlementEvent[]> {
  const server = new rpc.Server(RPC_URL);

  let startLedger: number;
  try {
    const latest = await server.getLatestLedger();
    startLedger = Math.max(2, latest.sequence - RETENTION_WINDOW_LEDGERS);
  } catch {
    return [];
  }

  let response;
  try {
    response = await server.getEvents({
      startLedger,
      filters: [{ type: "contract", contractIds: [SETTLEMENT_CONTRACT_ID] }],
      limit: 200,
    });
  } catch {
    return [];
  }

  const results: SettlementEvent[] = [];
  for (const event of response.events) {
    try {
      const topics = event.topic.map((t) => scValToNative(t));
      if (topics[0] !== "settled") continue;
      if (BigInt(topics[1]) !== groupId) continue;

      const transfer = scValToNative(event.value) as { from: string; to: string; amount: bigint | number };
      results.push({
        txHash: event.txHash,
        ledgerClosedAt: event.ledgerClosedAt,
        from: transfer.from,
        to: transfer.to,
        amount: BigInt(transfer.amount),
      });
    } catch {
      continue;
    }
  }

  return results.reverse();
}
