#![no_std]

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
}

#[cfg(test)]
mod test;
