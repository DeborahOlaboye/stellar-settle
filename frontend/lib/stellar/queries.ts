import type { Group, Expense, Transfer } from "settlement-client";
import { createSettlementClient, createTokenClient } from "./clients";

export type { Group, Expense, Transfer };

export async function fetchMemberGroups(publicKey: string): Promise<bigint[]> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.get_member_groups({ member: publicKey });
  return result;
}

export async function fetchGroup(publicKey: string | null, groupId: bigint): Promise<Group> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.get_group({ group_id: groupId });
  return result;
}

export async function fetchGroupExpenses(publicKey: string | null, groupId: bigint): Promise<Expense[]> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.get_group_expenses({ group_id: groupId });
  return result;
}

export async function fetchExpense(publicKey: string | null, groupId: bigint, expenseId: bigint): Promise<Expense> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.get_expense({ group_id: groupId, expense_id: expenseId });
  return result;
}

export async function fetchMemberBalance(
  publicKey: string | null,
  groupId: bigint,
  member: string,
): Promise<bigint> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.get_member_balance({ group_id: groupId, member });
  return result;
}

export async function fetchPreviewSettlement(
  publicKey: string | null,
  groupId: bigint,
): Promise<Transfer[]> {
  const client = createSettlementClient(publicKey);
  const { result } = await client.preview_settlement({ group_id: groupId });
  return result;
}

export async function fetchTokenSymbol(publicKey: string | null, tokenId: string): Promise<string> {
  const client = createTokenClient(publicKey, tokenId);
  const { result } = await client.symbol();
  return result;
}
