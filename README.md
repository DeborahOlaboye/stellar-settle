# stellar-settle

Cross-border group expense splitting on Stellar. Groups log shared expenses,
the contract tracks net balances per member, and settling collapses those
balances into a minimal set of token transfers executed atomically on-chain.

Built for the Stellar Journey to Mastery builder challenge.

## Why Stellar

- **Path payments** let a payer settle in whatever asset they hold while the
  receiver gets their preferred asset, converted atomically on the ledger.
- **Sub-cent fees** make settling small line items (a $4 coffee, a $12 taxi
  share) economically worth doing instead of letting debts linger.
- **Anchors (SEP-24)** give non-crypto-native group members a real path to
  cash out to a bank or mobile money.

## Project structure

```text
.
├── contracts
│   └── settlement
│       ├── src
│       │   ├── lib.rs        # contract entry points
│       │   ├── types.rs      # Group, Expense, Transfer, storage keys
│       │   ├── group.rs      # group creation/lookup
│       │   ├── expense.rs    # expense logging + confirm/dispute
│       │   ├── balances.rs   # per-member net balance storage
│       │   ├── netting.rs    # minimal transfer set (debt-netting) algorithm
│       │   └── settle.rs     # settlement execution via token transfers
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

## Contract flow

1. `create_group` — a group is settled in a single asset (its `token`); the
   creator must be one of the members.
2. `log_expense` — the payer logs an amount split equally among
   participants, with any remainder distributed to the earliest
   participants so shares always sum exactly to the amount. The expense
   does not affect balances yet.
3. `confirm_expense` / `dispute_expense` — each participant acknowledges
   their share (applying it to net balances) or disputes it (excluding it).
   This is the confirmation window: a logged expense isn't a real debt
   until the person who owes it agrees.
4. `preview_settlement` — read-only computation of the minimal transfer set
   for a group's current balances, for a frontend to show before anyone
   signs.
5. `settle` — executes that transfer set as token transfers and zeroes the
   group's balances. Each debtor's `require_auth` is enforced inside the
   token transfer, so in a real transaction this is submitted with
   authorization entries from every member currently in debt, not just the
   caller.

## Development

```bash
cargo test -p settlement    # unit + integration tests
stellar contract build      # build the wasm target
```

`soroban-sdk` is pinned to `22.0.11` — newer releases (25.x, 27.0.0) fail to
compile with the `testutils` feature due to an upstream dependency conflict
between `ed25519-dalek` and `rand_core` in `soroban-env-host`.
