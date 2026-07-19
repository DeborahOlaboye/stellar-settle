#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Env, String};

fn setup_token(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract_v2(admin.clone()).address()
}

#[test]
fn full_expense_and_settlement_flow() {
    let env = Env::default();
    // settle() triggers require_auth() for each debtor from inside the
    // nested token transfer, not just the caller — in a real transaction
    // that's satisfied by separate auth entries from each debtor.
    env.mock_all_auths_allowing_non_root_auth();

    let admin = Address::generate(&env);
    let token_id = setup_token(&env, &admin);
    let token_admin = token::StellarAssetClient::new(&env, &token_id);
    let token_client = token::TokenClient::new(&env, &token_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    // Bob and Carol need funds on hand to settle what they end up owing.
    token_admin.mint(&bob, &10_000);
    token_admin.mint(&carol, &10_000);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let members = Vec::from_array(&env, [alice.clone(), bob.clone(), carol.clone()]);
    let group_id = client.create_group(
        &alice,
        &String::from_str(&env, "Trip"),
        &token_id,
        &members,
    );

    // Alice pays 300 for dinner, split evenly between Bob and Carol.
    let participants = Vec::from_array(&env, [bob.clone(), carol.clone()]);
    let expense_id = client.log_expense(
        &group_id,
        &alice,
        &300,
        &String::from_str(&env, "dinner"),
        &participants,
    );

    // Balances stay at zero until each participant confirms their share.
    assert_eq!(client.get_member_balance(&group_id, &alice), 0);

    client.confirm_expense(&group_id, &expense_id, &bob);
    assert_eq!(client.get_member_balance(&group_id, &alice), 150);
    assert_eq!(client.get_member_balance(&group_id, &bob), -150);
    assert_eq!(client.get_member_balance(&group_id, &carol), 0);

    client.confirm_expense(&group_id, &expense_id, &carol);
    assert_eq!(client.get_member_balance(&group_id, &alice), 300);
    assert_eq!(client.get_member_balance(&group_id, &bob), -150);
    assert_eq!(client.get_member_balance(&group_id, &carol), -150);

    let preview = client.preview_settlement(&group_id);
    assert_eq!(preview.len(), 2);

    let alice_before = token_client.balance(&alice);
    client.settle(&group_id, &alice);
    let alice_after = token_client.balance(&alice);

    assert_eq!(alice_after - alice_before, 300);
    assert_eq!(token_client.balance(&bob), 10_000 - 150);
    assert_eq!(token_client.balance(&carol), 10_000 - 150);

    assert_eq!(client.get_member_balance(&group_id, &alice), 0);
    assert_eq!(client.get_member_balance(&group_id, &bob), 0);
    assert_eq!(client.get_member_balance(&group_id, &carol), 0);
}

#[test]
fn expense_split_remainder_goes_to_earliest_participants() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = setup_token(&env, &admin);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    let dave = Address::generate(&env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let members = Vec::from_array(&env, [alice.clone(), bob.clone(), carol.clone(), dave.clone()]);
    let group_id = client.create_group(
        &alice,
        &String::from_str(&env, "Roommates"),
        &token_id,
        &members,
    );

    // 100 split three ways: 34/33/33, remainder goes to the first participant.
    let participants = Vec::from_array(&env, [bob.clone(), carol.clone(), dave.clone()]);
    let expense_id = client.log_expense(
        &group_id,
        &alice,
        &100,
        &String::from_str(&env, "utilities"),
        &participants,
    );

    client.confirm_expense(&group_id, &expense_id, &bob);
    client.confirm_expense(&group_id, &expense_id, &carol);
    client.confirm_expense(&group_id, &expense_id, &dave);

    assert_eq!(client.get_member_balance(&group_id, &bob), -34);
    assert_eq!(client.get_member_balance(&group_id, &carol), -33);
    assert_eq!(client.get_member_balance(&group_id, &dave), -33);
    assert_eq!(client.get_member_balance(&group_id, &alice), 100);
}

#[test]
fn disputed_share_does_not_affect_balances() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = setup_token(&env, &admin);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let members = Vec::from_array(&env, [alice.clone(), bob.clone(), carol.clone()]);
    let group_id = client.create_group(
        &alice,
        &String::from_str(&env, "Team"),
        &token_id,
        &members,
    );

    let participants = Vec::from_array(&env, [bob.clone(), carol.clone()]);
    let expense_id = client.log_expense(
        &group_id,
        &alice,
        &200,
        &String::from_str(&env, "software license"),
        &participants,
    );

    client.dispute_expense(&group_id, &expense_id, &bob);
    client.confirm_expense(&group_id, &expense_id, &carol);

    assert_eq!(client.get_member_balance(&group_id, &bob), 0);
    assert_eq!(client.get_member_balance(&group_id, &carol), -100);
    assert_eq!(client.get_member_balance(&group_id, &alice), 100);

    let expense = client.get_expense(&group_id, &expense_id);
    assert_eq!(expense.disputed.len(), 1);
    assert_eq!(expense.confirmed.len(), 1);
}

#[test]
#[should_panic(expected = "creator must be a member of the group")]
fn create_group_requires_creator_to_be_a_member() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = setup_token(&env, &admin);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let outsider = Address::generate(&env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let members = Vec::from_array(&env, [alice.clone(), bob.clone()]);
    client.create_group(
        &outsider,
        &String::from_str(&env, "Bad Group"),
        &token_id,
        &members,
    );
}

#[test]
#[should_panic(expected = "already confirmed")]
fn cannot_confirm_expense_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = setup_token(&env, &admin);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let members = Vec::from_array(&env, [alice.clone(), bob.clone()]);
    let group_id = client.create_group(
        &alice,
        &String::from_str(&env, "Pair"),
        &token_id,
        &members,
    );

    let participants = Vec::from_array(&env, [bob.clone()]);
    let expense_id = client.log_expense(
        &group_id,
        &alice,
        &50,
        &String::from_str(&env, "coffee"),
        &participants,
    );

    client.confirm_expense(&group_id, &expense_id, &bob);
    client.confirm_expense(&group_id, &expense_id, &bob);
}
