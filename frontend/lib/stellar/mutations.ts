import { createSettlementClient } from "./clients";

export async function createGroup(
  publicKey: string,
  args: { name: string; token: string; members: string[] },
): Promise<bigint> {
  const client = createSettlementClient(publicKey);
  const tx = await client.create_group({ creator: publicKey, ...args });
  const sent = await tx.signAndSend();
  return sent.result;
}

export async function logExpense(
  publicKey: string,
  args: { groupId: bigint; payer: string; amount: bigint; description: string; participants: string[] },
): Promise<bigint> {
  const client = createSettlementClient(publicKey);
  const tx = await client.log_expense({
    group_id: args.groupId,
    payer: args.payer,
    amount: args.amount,
    description: args.description,
    participants: args.participants,
  });
  const sent = await tx.signAndSend();
  return sent.result;
}

export async function confirmExpense(
  publicKey: string,
  args: { groupId: bigint; expenseId: bigint },
): Promise<void> {
  const client = createSettlementClient(publicKey);
  const tx = await client.confirm_expense({
    group_id: args.groupId,
    expense_id: args.expenseId,
    participant: publicKey,
  });
  await tx.signAndSend();
}

export async function disputeExpense(
  publicKey: string,
  args: { groupId: bigint; expenseId: bigint },
): Promise<void> {
  const client = createSettlementClient(publicKey);
  const tx = await client.dispute_expense({
    group_id: args.groupId,
    expense_id: args.expenseId,
    participant: publicKey,
  });
  await tx.signAndSend();
}
