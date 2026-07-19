use soroban_sdk::{Address, Env, Vec};

use crate::types::Transfer;

/// Reduces a set of net balances to a minimal set of transfers using the
/// classic greedy debtor/creditor matching (max creditor <-> max debtor,
/// repeat). Produces at most n-1 transfers for n non-zero balances, instead
/// of a naive O(n^2) pairwise settlement.
pub fn compute_minimal_transfers(env: &Env, addrs: Vec<Address>, mut amounts: Vec<i128>) -> Vec<Transfer> {
    let mut transfers = Vec::new(env);
    let n = amounts.len();

    loop {
        let mut credit_idx: Option<u32> = None;
        let mut credit_val: i128 = 0;
        let mut debit_idx: Option<u32> = None;
        let mut debit_val: i128 = 0;

        for i in 0..n {
            let v = amounts.get(i).unwrap();
            if v > credit_val {
                credit_val = v;
                credit_idx = Some(i);
            }
            if v < debit_val {
                debit_val = v;
                debit_idx = Some(i);
            }
        }

        let (ci, di) = match (credit_idx, debit_idx) {
            (Some(ci), Some(di)) => (ci, di),
            _ => break,
        };

        let amount = if credit_val < -debit_val { credit_val } else { -debit_val };
        transfers.push_back(Transfer {
            from: addrs.get(di).unwrap(),
            to: addrs.get(ci).unwrap(),
            amount,
        });

        amounts.set(ci, credit_val - amount);
        amounts.set(di, debit_val + amount);
    }

    transfers
}
