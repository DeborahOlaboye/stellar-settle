use soroban_sdk::{Address, Env, String, Vec};

use crate::group::load_group;
use crate::types::{DataKey, Expense};

const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_AMOUNT: u32 = 60 * DAY_IN_LEDGERS;

pub fn log_expense(
    env: &Env,
    group_id: u64,
    payer: Address,
    amount: i128,
    description: String,
    participants: Vec<Address>,
) -> u64 {
    payer.require_auth();
    assert!(amount > 0, "amount must be positive");
    assert!(!participants.is_empty(), "expense needs at least one participant");

    let group = load_group(env, group_id);
    assert!(group.members.contains(&payer), "payer is not a group member");
    for p in participants.iter() {
        assert!(group.members.contains(&p), "participant is not a group member");
    }

    // Equal split with remainder distributed to the first participants so
    // shares always sum exactly to `amount` (no dust left unaccounted for).
    let n = participants.len() as i128;
    let base = amount / n;
    let remainder = amount % n;
    let mut shares = Vec::new(env);
    for i in 0..participants.len() {
        let share = if (i as i128) < remainder { base + 1 } else { base };
        shares.push_back(share);
    }

    let id = env
        .storage()
        .instance()
        .get(&DataKey::ExpenseCount(group_id))
        .unwrap_or(0u64)
        + 1;
    env.storage()
        .instance()
        .set(&DataKey::ExpenseCount(group_id), &id);
    env.storage()
        .instance()
        .extend_ttl(BUMP_THRESHOLD, BUMP_AMOUNT);

    let expense = Expense {
        id,
        group_id,
        payer,
        amount,
        description,
        participants,
        shares,
        confirmed: Vec::new(env),
        disputed: Vec::new(env),
    };
    let key = DataKey::Expense(group_id, id);
    env.storage().persistent().set(&key, &expense);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);

    id
}

pub fn load_expense(env: &Env, group_id: u64, expense_id: u64) -> Expense {
    env.storage()
        .persistent()
        .get(&DataKey::Expense(group_id, expense_id))
        .unwrap_or_else(|| panic!("expense not found"))
}
