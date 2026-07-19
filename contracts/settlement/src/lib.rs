#![no_std]

mod balances;
mod expense;
mod group;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

pub use types::{Expense, Group, Transfer};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Creates a group settled in a single asset (`token`). The creator must
    /// be one of the members.
    pub fn create_group(
        env: Env,
        creator: Address,
        name: String,
        token: Address,
        members: Vec<Address>,
    ) -> u64 {
        group::create_group(&env, creator, name, token, members)
    }

    pub fn get_group(env: Env, group_id: u64) -> Group {
        group::load_group(&env, group_id)
    }

    pub fn get_member_balance(env: Env, group_id: u64, member: Address) -> i128 {
        balances::get_balance(&env, group_id, &member)
    }

    /// Logs an expense split equally among `participants`. The expense does
    /// not affect balances until each participant confirms their share.
    pub fn log_expense(
        env: Env,
        group_id: u64,
        payer: Address,
        amount: i128,
        description: String,
        participants: Vec<Address>,
    ) -> u64 {
        expense::log_expense(&env, group_id, payer, amount, description, participants)
    }

    /// Confirms a participant's share of an expense, applying it to net
    /// balances. Requires the participant's own authorization.
    pub fn confirm_expense(env: Env, group_id: u64, expense_id: u64, participant: Address) {
        expense::confirm_expense(&env, group_id, expense_id, participant)
    }

    /// Disputes a participant's share of an expense; excludes it from
    /// balances without affecting other participants' confirmations.
    pub fn dispute_expense(env: Env, group_id: u64, expense_id: u64, participant: Address) {
        expense::dispute_expense(&env, group_id, expense_id, participant)
    }

    pub fn get_expense(env: Env, group_id: u64, expense_id: u64) -> Expense {
        expense::load_expense(&env, group_id, expense_id)
    }
}

#[cfg(test)]
mod test;
