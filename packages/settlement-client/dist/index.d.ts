import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CCFOZE4G2B6ZNUWSMFAMJA6WAFZMLUOMIXZMJV3N3Y75TVIC3PO2SRCB";
    };
};
export interface Group {
    id: u64;
    members: Array<string>;
    name: string;
    token: string;
}
export type DataKey = {
    tag: "GroupCount";
    values: void;
} | {
    tag: "Group";
    values: readonly [u64];
} | {
    tag: "ExpenseCount";
    values: readonly [u64];
} | {
    tag: "Expense";
    values: readonly [u64, u64];
} | {
    tag: "Balance";
    values: readonly [u64, string];
} | {
    tag: "MemberGroups";
    values: readonly [string];
};
export interface Expense {
    amount: i128;
    confirmed: Array<string>;
    description: string;
    disputed: Array<string>;
    group_id: u64;
    id: u64;
    participants: Array<string>;
    payer: string;
    shares: Array<i128>;
}
export interface Transfer {
    amount: i128;
    from: string;
    to: string;
}
export interface Client {
    /**
     * Construct and simulate a settle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Executes the minimal transfer set as token transfers and zeroes out
     * the group's balances. Must be submitted with authorization from every
     * member currently in debt.
     */
    settle: ({ group_id, caller }: {
        group_id: u64;
        caller: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<Transfer>>>;
    /**
     * Construct and simulate a get_group transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_group: ({ group_id }: {
        group_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Group>>;
    /**
     * Construct and simulate a get_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_expense: ({ group_id, expense_id }: {
        group_id: u64;
        expense_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Expense>>;
    /**
     * Construct and simulate a log_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Logs an expense split equally among `participants`. The expense does
     * not affect balances until each participant confirms their share.
     */
    log_expense: ({ group_id, payer, amount, description, participants }: {
        group_id: u64;
        payer: string;
        amount: i128;
        description: string;
        participants: Array<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a create_group transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Creates a group settled in a single asset (`token`). The creator must
     * be one of the members.
     */
    create_group: ({ creator, name, token, members }: {
        creator: string;
        name: string;
        token: string;
        members: Array<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a confirm_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Confirms a participant's share of an expense, applying it to net
     * balances. Requires the participant's own authorization.
     */
    confirm_expense: ({ group_id, expense_id, participant }: {
        group_id: u64;
        expense_id: u64;
        participant: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a dispute_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Disputes a participant's share of an expense; excludes it from
     * balances without affecting other participants' confirmations.
     */
    dispute_expense: ({ group_id, expense_id, participant }: {
        group_id: u64;
        expense_id: u64;
        participant: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_member_groups transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Lists the IDs of every group a member belongs to.
     */
    get_member_groups: ({ member }: {
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>;
    /**
     * Construct and simulate a get_group_expenses transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Lists every expense logged in a group, oldest first.
     */
    get_group_expenses: ({ group_id }: {
        group_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<Expense>>>;
    /**
     * Construct and simulate a get_member_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_member_balance: ({ group_id, member }: {
        group_id: u64;
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a preview_settlement transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Computes the minimal transfer set for a group's current balances
     * without executing anything, for the frontend to show before settling.
     */
    preview_settlement: ({ group_id }: {
        group_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<Transfer>>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        settle: (json: string) => AssembledTransaction<Transfer[]>;
        get_group: (json: string) => AssembledTransaction<Group>;
        get_expense: (json: string) => AssembledTransaction<Expense>;
        log_expense: (json: string) => AssembledTransaction<bigint>;
        create_group: (json: string) => AssembledTransaction<bigint>;
        confirm_expense: (json: string) => AssembledTransaction<null>;
        dispute_expense: (json: string) => AssembledTransaction<null>;
        get_member_groups: (json: string) => AssembledTransaction<bigint[]>;
        get_group_expenses: (json: string) => AssembledTransaction<Expense[]>;
        get_member_balance: (json: string) => AssembledTransaction<bigint>;
        preview_settlement: (json: string) => AssembledTransaction<Transfer[]>;
    };
}
