import { createSettlementClient } from "./clients";

export async function createGroup(
  publicKey: string,
  args: { name: string; token: string; members: string[] },
): Promise<{ groupId: bigint; txHash: string }> {
  const client = createSettlementClient(publicKey);
  const tx = await client.create_group({ creator: publicKey, ...args });
  const sent = await tx.signAndSend();
  return { groupId: sent.result, txHash: sent.sendTransactionResponse?.hash ?? "" };
}

export async function logExpense(
  publicKey: string,
  args: { groupId: bigint; payer: string; amount: bigint; description: string; participants: string[] },
): Promise<{ expenseId: bigint; txHash: string }> {
  const client = createSettlementClient(publicKey);
  const tx = await client.log_expense({
    group_id: args.groupId,
    payer: args.payer,
    amount: args.amount,
    description: args.description,
    participants: args.participants,
  });
  const sent = await tx.signAndSend();
  return { expenseId: sent.result, txHash: sent.sendTransactionResponse?.hash ?? "" };
}

export async function confirmExpense(
  publicKey: string,
  args: { groupId: bigint; expenseId: bigint },
): Promise<{ txHash: string }> {
  const client = createSettlementClient(publicKey);
  const tx = await client.confirm_expense({
    group_id: args.groupId,
    expense_id: args.expenseId,
    participant: publicKey,
  });
  const sent = await tx.signAndSend();
  return { txHash: sent.sendTransactionResponse?.hash ?? "" };
}

export async function disputeExpense(
  publicKey: string,
  args: { groupId: bigint; expenseId: bigint },
): Promise<{ txHash: string }> {
  const client = createSettlementClient(publicKey);
  const tx = await client.dispute_expense({
    group_id: args.groupId,
    expense_id: args.expenseId,
    participant: publicKey,
  });
  const sent = await tx.signAndSend();
  return { txHash: sent.sendTransactionResponse?.hash ?? "" };
}
