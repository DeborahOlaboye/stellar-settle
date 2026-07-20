use soroban_sdk::{contracttype, Address, String, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    GroupCount,
    Group(u64),
    ExpenseCount(u64),
    Expense(u64, u64),
    Balance(u64, Address),
    MemberGroups(Address),
}

#[derive(Clone)]
#[contracttype]
pub struct Group {
    pub id: u64,
    pub name: String,
    pub token: Address,
    pub members: Vec<Address>,
}

#[derive(Clone)]
#[contracttype]
pub struct Expense {
    pub id: u64,
    pub group_id: u64,
    pub payer: Address,
    pub amount: i128,
    pub description: String,
    pub participants: Vec<Address>,
    pub shares: Vec<i128>,
    pub confirmed: Vec<Address>,
    pub disputed: Vec<Address>,
}

#[derive(Clone)]
#[contracttype]
pub struct Transfer {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}
