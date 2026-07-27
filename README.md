# stellar-settle

Cross-border group expense splitting on Stellar. Groups log shared expenses,
the contract tracks net balances per member, and settling collapses those
balances into a minimal set of token transfers executed atomically on-chain.

Built for the Stellar Journey to Mastery builder challenge (Level 4).

**Live app:** https://stellar-settle-frontend.vercel.app/
**Feedback form:** https://docs.google.com/forms/d/e/1FAIpQLSeaFS7Um-dxvSLKnls-A1NMGxn9PCJOzIC8_3GfqzZ4lVXihw/viewform
**Settlement contract (testnet):** `CCFOZE4G2B6ZNUWSMFAMJA6WAFZMLUOMIXZMJV3N3Y75TVIC3PO2SRCB`

## Why Stellar

- **Path payments** let a payer settle in whatever asset they hold while the
  receiver gets their preferred asset, converted atomically on the ledger.
- **Sub-cent fees** make settling small line items (a $4 coffee, a $12 taxi
  share) economically worth doing instead of letting debts linger.
- **Anchors (SEP-24)** could give non-crypto-native group members a path to
  cash out to a bank or mobile money account — planned (see Roadmap), not
  built yet. Nothing in the current app claims this is live.

## Project structure

```text
.
├── contracts
│   └── settlement
│       ├── src
│       │   ├── lib.rs        # contract entry points
│       │   ├── types.rs      # Group, Expense, Transfer, storage keys
│       │   ├── group.rs      # group creation/lookup, member->groups index
│       │   ├── expense.rs    # expense logging + confirm/dispute
│       │   ├── balances.rs   # per-member net balance storage
│       │   ├── netting.rs    # minimal transfer set (debt-netting) algorithm
│       │   └── settle.rs     # settlement execution via token transfers
│       └── Cargo.toml
├── packages
│   ├── settlement-client      # generated TS bindings for the settlement contract
│   └── token-client            # generated TS bindings for the demo SETL token
├── frontend                    # Next.js frontend (App Router)
├── Cargo.toml
├── package.json                # npm workspace root
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

## Frontend

Deployed on testnet:

- Settlement contract: `CCFOZE4G2B6ZNUWSMFAMJA6WAFZMLUOMIXZMJV3N3Y75TVIC3PO2SRCB`
- Demo settlement token (SETL): `CBDYIM4WCQIE2QEP7TAS3WDCQ2WUJQZPF35T7OEWI5W5BSBR7W3CT24U`

```bash
npm install                          # from repo root, installs the workspace
npm run build -w packages/settlement-client
npm run build -w packages/token-client
npm run dev -w frontend               # http://localhost:3000
```

To try it: install the [Freighter](https://www.freighter.app/) wallet extension,
switch it to Testnet, and fund your account via
[Friendbot](https://laboratory.stellar.org/#account-creator?network=test). That
funds you with XLM, which is also the default settlement token — no separate
faucet or minting step needed to create a group or settle up. (A custom demo
token, SETL, and its issuer key still exist and can be selected via "Other..."
in the token picker, but nothing in the app depends on it anymore.)

The settle flow requires an auth-entry signature from every member currently
in debt, not just whoever clicks "Confirm & settle" — in the demo, switch
Freighter's active account between each debtor's signature.

## Screenshots

| Desktop | Mobile |
| --- | --- |
| ![Desktop landing](docs/screenshots/desktop-landing.png) | ![Mobile landing](docs/screenshots/mobile-landing.png) |

The landing page needs no wallet connection, so these are pulled straight from
the live deployment — no fabricated data. Screenshots of the connected app
(groups, balances, expenses) aren't included here yet because that requires
a real wallet session with real on-chain groups; see the live app link above
to try it directly instead of a static image of made-up data.

## Product quality

- **Monitoring/analytics:** Vercel Analytics and Speed Insights are wired
  into the root layout. Custom events (`wallet_connected`, `group_created`,
  `expense_logged`, `expense_confirmed`, `expense_disputed`,
  `settlement_completed`) track the core flows from the Vercel dashboard.
- **Feedback collection:** a "Send feedback" link in the sidebar opens a
  short form (falls back to a `mailto:` link if `NEXT_PUBLIC_FEEDBACK_FORM_URL`
  isn't set).
- **Mobile responsive:** the connected app's sidebar collapses into a
  top bar below the `md` breakpoint, and the landing page reflows to a
  single column with no horizontal overflow at 390px-wide viewports.
- **Loading/error states:** every async screen (groups, balances,
  expenses, settlement preview) has a loading state, and failures surface
  as a toast rather than a silent failure.
