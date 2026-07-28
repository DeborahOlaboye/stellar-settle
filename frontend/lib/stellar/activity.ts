import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { RPC_URL, SETTLEMENT_CONTRACT_ID } from "./config";

type BaseEvent = { txHash: string; ledgerClosedAt: string };

export type ActivityEvent =
  | (BaseEvent & { type: "group_created"; creator: string })
  | (BaseEvent & { type: "expense_logged"; expenseId: bigint; payer: string; amount: bigint })
  | (BaseEvent & { type: "expense_confirmed"; expenseId: bigint; participant: string })
  | (BaseEvent & { type: "expense_disputed"; expenseId: bigint; participant: string })
  | (BaseEvent & { type: "settled"; from: string; to: string; amount: bigint });

const RETENTION_WINDOW_LEDGERS = 100_000; // public RPC retains roughly this much event history

/** Reads every real on-chain event the contract emitted for a group — group
 * creation, expenses logged/confirmed/disputed, and settlements — so past
 * activity stays provable with a real transaction link even after balances
 * change or zero back out. One combined query instead of one per event type. */
export async function fetchGroupActivity(groupId: bigint): Promise<ActivityEvent[]> {
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
      limit: 1000,
    });
  } catch {
    return [];
  }

  const results: ActivityEvent[] = [];
  for (const event of response.events) {
    try {
      const topics = event.topic.map((t) => scValToNative(t));
      const kind = topics[0];
      const base = { txHash: event.txHash, ledgerClosedAt: event.ledgerClosedAt };

      if (kind === "grp_new") {
        if (BigInt(topics[1]) !== groupId) continue;
        const creator = scValToNative(event.value) as string;
        results.push({ ...base, type: "group_created", creator });
      } else if (kind === "exp_new") {
        if (BigInt(topics[1]) !== groupId) continue;
        const [expenseId, payer, amount] = scValToNative(event.value) as [bigint, string, bigint];
        results.push({ ...base, type: "expense_logged", expenseId: BigInt(expenseId), payer, amount: BigInt(amount) });
      } else if (kind === "exp_conf") {
        if (BigInt(topics[1]) !== groupId) continue;
        const [expenseId, participant] = scValToNative(event.value) as [bigint, string];
        results.push({ ...base, type: "expense_confirmed", expenseId: BigInt(expenseId), participant });
      } else if (kind === "exp_disp") {
        if (BigInt(topics[1]) !== groupId) continue;
        const [expenseId, participant] = scValToNative(event.value) as [bigint, string];
        results.push({ ...base, type: "expense_disputed", expenseId: BigInt(expenseId), participant });
      } else if (kind === "settled") {
        if (BigInt(topics[1]) !== groupId) continue;
        const transfer = scValToNative(event.value) as { from: string; to: string; amount: bigint | number };
        results.push({ ...base, type: "settled", from: transfer.from, to: transfer.to, amount: BigInt(transfer.amount) });
      }
    } catch {
      continue;
    }
  }

  return results.reverse();
}
