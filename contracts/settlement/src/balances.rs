use soroban_sdk::{Address, Env};

use crate::types::DataKey;

const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_AMOUNT: u32 = 60 * DAY_IN_LEDGERS;

/// Net balance for a member within a group.
/// Positive means the group owes them; negative means they owe the group.
pub fn get_balance(env: &Env, group_id: u64, member: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(group_id, member.clone()))
        .unwrap_or(0)
}

pub fn set_balance(env: &Env, group_id: u64, member: &Address, amount: i128) {
    let key = DataKey::Balance(group_id, member.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}
