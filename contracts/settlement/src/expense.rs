use soroban_sdk::{symbol_short, Address, Env, String, Vec};

use crate::balances::{get_balance, set_balance};
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

    env.events()
        .publish((symbol_short!("exp_new"), group_id), (id, expense.payer.clone(), expense.amount));

    id
}

pub fn confirm_expense(env: &Env, group_id: u64, expense_id: u64, participant: Address) {
    participant.require_auth();
    let mut expense = load_expense(env, group_id, expense_id);
    assert!(!expense.confirmed.contains(&participant), "already confirmed");
    assert!(!expense.disputed.contains(&participant), "already disputed");

    let idx = expense
        .participants
        .iter()
        .position(|a| a == participant)
        .unwrap_or_else(|| panic!("not a participant on this expense"));
    let share = expense.shares.get(idx as u32).unwrap();

    let payer_balance = get_balance(env, group_id, &expense.payer);
    set_balance(env, group_id, &expense.payer, payer_balance + share);
    let participant_balance = get_balance(env, group_id, &participant);
    set_balance(env, group_id, &participant, participant_balance - share);

    env.events()
        .publish((symbol_short!("exp_conf"), group_id), (expense_id, participant.clone()));
    expense.confirmed.push_back(participant);
    let key = DataKey::Expense(group_id, expense_id);
    env.storage().persistent().set(&key, &expense);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}

pub fn dispute_expense(env: &Env, group_id: u64, expense_id: u64, participant: Address) {
    participant.require_auth();
    let mut expense = load_expense(env, group_id, expense_id);
    assert!(!expense.confirmed.contains(&participant), "already confirmed");
    assert!(!expense.disputed.contains(&participant), "already disputed");
    assert!(
        expense.participants.contains(&participant),
        "not a participant on this expense"
    );

    env.events()
        .publish((symbol_short!("exp_disp"), group_id), (expense_id, participant.clone()));
    expense.disputed.push_back(participant);
    let key = DataKey::Expense(group_id, expense_id);
    env.storage().persistent().set(&key, &expense);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}

pub fn load_expense(env: &Env, group_id: u64, expense_id: u64) -> Expense {
    env.storage()
        .persistent()
        .get(&DataKey::Expense(group_id, expense_id))
        .unwrap_or_else(|| panic!("expense not found"))
}

pub fn list_expenses(env: &Env, group_id: u64) -> Vec<Expense> {
    let count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::ExpenseCount(group_id))
        .unwrap_or(0u64);

    let mut expenses = Vec::new(env);
    for id in 1..=count {
        expenses.push_back(load_expense(env, group_id, id));
    }
    expenses
}
