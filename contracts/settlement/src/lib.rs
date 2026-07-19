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
}

#[cfg(test)]
mod test;
