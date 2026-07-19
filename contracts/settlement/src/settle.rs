use soroban_sdk::{symbol_short, token, Address, Env, Vec};

use crate::balances::{get_balance, set_balance};
use crate::group::load_group;
use crate::netting::compute_minimal_transfers;
use crate::types::Transfer;

pub fn preview_settlement(env: &Env, group_id: u64) -> Vec<Transfer> {
    let group = load_group(env, group_id);
    let (addrs, amounts) = collect_balances(env, group_id, &group.members);
    compute_minimal_transfers(env, addrs, amounts)
}

/// Executes the minimal transfer set for a group as atomic token transfers.
/// Each debtor must have authorized this transaction (their `require_auth`
/// is enforced inside the token contract's `transfer`), so `settle` is
/// expected to be submitted as a multi-party transaction collecting
/// signatures from every member with a negative balance.
pub fn settle(env: &Env, group_id: u64, caller: Address) -> Vec<Transfer> {
    caller.require_auth();
    let group = load_group(env, group_id);
    assert!(group.members.contains(&caller), "caller is not a group member");

    let (addrs, amounts) = collect_balances(env, group_id, &group.members);
    let transfers = compute_minimal_transfers(env, addrs, amounts);

    let token_client = token::TokenClient::new(env, &group.token);
    for transfer in transfers.iter() {
        token_client.transfer(&transfer.from, &transfer.to, &transfer.amount);
        env.events()
            .publish((symbol_short!("settled"), group_id), transfer.clone());
    }

    for member in group.members.iter() {
        set_balance(env, group_id, &member, 0);
    }

    transfers
}

fn collect_balances(env: &Env, group_id: u64, members: &Vec<Address>) -> (Vec<Address>, Vec<i128>) {
    let mut addrs = Vec::new(env);
    let mut amounts = Vec::new(env);
    for member in members.iter() {
        let balance = get_balance(env, group_id, &member);
        addrs.push_back(member);
        amounts.push_back(balance);
    }
    (addrs, amounts)
}
