use soroban_sdk::{Address, Env, String, Vec};

use crate::types::{DataKey, Group};

const DAY_IN_LEDGERS: u32 = 17280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_AMOUNT: u32 = 60 * DAY_IN_LEDGERS;

pub fn create_group(env: &Env, creator: Address, name: String, token: Address, members: Vec<Address>) -> u64 {
    creator.require_auth();
    assert!(members.contains(&creator), "creator must be a member of the group");
    assert!(members.len() >= 2, "group needs at least 2 members");

    let id = env
        .storage()
        .instance()
        .get(&DataKey::GroupCount)
        .unwrap_or(0u64)
        + 1;
    env.storage().instance().set(&DataKey::GroupCount, &id);
    env.storage()
        .instance()
        .extend_ttl(BUMP_THRESHOLD, BUMP_AMOUNT);

    let group = Group {
        id,
        name,
        token,
        members,
    };
    let key = DataKey::Group(id);
    env.storage().persistent().set(&key, &group);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);

    id
}

pub fn load_group(env: &Env, group_id: u64) -> Group {
    env.storage()
        .persistent()
        .get(&DataKey::Group(group_id))
        .unwrap_or_else(|| panic!("group not found"))
}
