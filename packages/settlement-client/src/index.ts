import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCFOZE4G2B6ZNUWSMFAMJA6WAFZMLUOMIXZMJV3N3Y75TVIC3PO2SRCB",
  }
} as const


export interface Group {
  id: u64;
  members: Array<string>;
  name: string;
  token: string;
}

export type DataKey = {tag: "GroupCount", values: void} | {tag: "Group", values: readonly [u64]} | {tag: "ExpenseCount", values: readonly [u64]} | {tag: "Expense", values: readonly [u64, u64]} | {tag: "Balance", values: readonly [u64, string]} | {tag: "MemberGroups", values: readonly [string]};


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
  settle: ({group_id, caller}: {group_id: u64, caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Transfer>>>

  /**
   * Construct and simulate a get_group transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_group: ({group_id}: {group_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Group>>

  /**
   * Construct and simulate a get_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_expense: ({group_id, expense_id}: {group_id: u64, expense_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Expense>>

  /**
   * Construct and simulate a log_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Logs an expense split equally among `participants`. The expense does
   * not affect balances until each participant confirms their share.
   */
  log_expense: ({group_id, payer, amount, description, participants}: {group_id: u64, payer: string, amount: i128, description: string, participants: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a create_group transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Creates a group settled in a single asset (`token`). The creator must
   * be one of the members.
   */
  create_group: ({creator, name, token, members}: {creator: string, name: string, token: string, members: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a confirm_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Confirms a participant's share of an expense, applying it to net
   * balances. Requires the participant's own authorization.
   */
  confirm_expense: ({group_id, expense_id, participant}: {group_id: u64, expense_id: u64, participant: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a dispute_expense transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Disputes a participant's share of an expense; excludes it from
   * balances without affecting other participants' confirmations.
   */
  dispute_expense: ({group_id, expense_id, participant}: {group_id: u64, expense_id: u64, participant: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_member_groups transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lists the IDs of every group a member belongs to.
   */
  get_member_groups: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_group_expenses transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lists every expense logged in a group, oldest first.
   */
  get_group_expenses: ({group_id}: {group_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Expense>>>

  /**
   * Construct and simulate a get_member_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_member_balance: ({group_id, member}: {group_id: u64, member: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a preview_settlement transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Computes the minimal transfer set for a group's current balances
   * without executing anything, for the frontend to show before settling.
   */
  preview_settlement: ({group_id}: {group_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Transfer>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAKNFeGVjdXRlcyB0aGUgbWluaW1hbCB0cmFuc2ZlciBzZXQgYXMgdG9rZW4gdHJhbnNmZXJzIGFuZCB6ZXJvZXMgb3V0CnRoZSBncm91cCdzIGJhbGFuY2VzLiBNdXN0IGJlIHN1Ym1pdHRlZCB3aXRoIGF1dGhvcml6YXRpb24gZnJvbSBldmVyeQptZW1iZXIgY3VycmVudGx5IGluIGRlYnQuAAAAAAZzZXR0bGUAAAAAAAIAAAAAAAAACGdyb3VwX2lkAAAABgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAQAAA+oAAAfQAAAACFRyYW5zZmVy",
        "AAAAAAAAAAAAAAAJZ2V0X2dyb3VwAAAAAAAAAQAAAAAAAAAIZ3JvdXBfaWQAAAAGAAAAAQAAB9AAAAAFR3JvdXAAAAA=",
        "AAAAAAAAAAAAAAALZ2V0X2V4cGVuc2UAAAAAAgAAAAAAAAAIZ3JvdXBfaWQAAAAGAAAAAAAAAApleHBlbnNlX2lkAAAAAAAGAAAAAQAAB9AAAAAHRXhwZW5zZQA=",
        "AAAAAAAAAIVMb2dzIGFuIGV4cGVuc2Ugc3BsaXQgZXF1YWxseSBhbW9uZyBgcGFydGljaXBhbnRzYC4gVGhlIGV4cGVuc2UgZG9lcwpub3QgYWZmZWN0IGJhbGFuY2VzIHVudGlsIGVhY2ggcGFydGljaXBhbnQgY29uZmlybXMgdGhlaXIgc2hhcmUuAAAAAAAAC2xvZ19leHBlbnNlAAAAAAUAAAAAAAAACGdyb3VwX2lkAAAABgAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAADHBhcnRpY2lwYW50cwAAA+oAAAATAAAAAQAAAAY=",
        "AAAAAAAAAFxDcmVhdGVzIGEgZ3JvdXAgc2V0dGxlZCBpbiBhIHNpbmdsZSBhc3NldCAoYHRva2VuYCkuIFRoZSBjcmVhdG9yIG11c3QKYmUgb25lIG9mIHRoZSBtZW1iZXJzLgAAAAxjcmVhdGVfZ3JvdXAAAAAEAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAAB21lbWJlcnMAAAAD6gAAABMAAAABAAAABg==",
        "AAAAAAAAAHhDb25maXJtcyBhIHBhcnRpY2lwYW50J3Mgc2hhcmUgb2YgYW4gZXhwZW5zZSwgYXBwbHlpbmcgaXQgdG8gbmV0CmJhbGFuY2VzLiBSZXF1aXJlcyB0aGUgcGFydGljaXBhbnQncyBvd24gYXV0aG9yaXphdGlvbi4AAAAPY29uZmlybV9leHBlbnNlAAAAAAMAAAAAAAAACGdyb3VwX2lkAAAABgAAAAAAAAAKZXhwZW5zZV9pZAAAAAAABgAAAAAAAAALcGFydGljaXBhbnQAAAAAEwAAAAA=",
        "AAAAAAAAAHxEaXNwdXRlcyBhIHBhcnRpY2lwYW50J3Mgc2hhcmUgb2YgYW4gZXhwZW5zZTsgZXhjbHVkZXMgaXQgZnJvbQpiYWxhbmNlcyB3aXRob3V0IGFmZmVjdGluZyBvdGhlciBwYXJ0aWNpcGFudHMnIGNvbmZpcm1hdGlvbnMuAAAAD2Rpc3B1dGVfZXhwZW5zZQAAAAADAAAAAAAAAAhncm91cF9pZAAAAAYAAAAAAAAACmV4cGVuc2VfaWQAAAAAAAYAAAAAAAAAC3BhcnRpY2lwYW50AAAAABMAAAAA",
        "AAAAAAAAADFMaXN0cyB0aGUgSURzIG9mIGV2ZXJ5IGdyb3VwIGEgbWVtYmVyIGJlbG9uZ3MgdG8uAAAAAAAAEWdldF9tZW1iZXJfZ3JvdXBzAAAAAAAAAQAAAAAAAAAGbWVtYmVyAAAAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAADRMaXN0cyBldmVyeSBleHBlbnNlIGxvZ2dlZCBpbiBhIGdyb3VwLCBvbGRlc3QgZmlyc3QuAAAAEmdldF9ncm91cF9leHBlbnNlcwAAAAAAAQAAAAAAAAAIZ3JvdXBfaWQAAAAGAAAAAQAAA+oAAAfQAAAAB0V4cGVuc2UA",
        "AAAAAAAAAAAAAAASZ2V0X21lbWJlcl9iYWxhbmNlAAAAAAACAAAAAAAAAAhncm91cF9pZAAAAAYAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAIZDb21wdXRlcyB0aGUgbWluaW1hbCB0cmFuc2ZlciBzZXQgZm9yIGEgZ3JvdXAncyBjdXJyZW50IGJhbGFuY2VzCndpdGhvdXQgZXhlY3V0aW5nIGFueXRoaW5nLCBmb3IgdGhlIGZyb250ZW5kIHRvIHNob3cgYmVmb3JlIHNldHRsaW5nLgAAAAAAEnByZXZpZXdfc2V0dGxlbWVudAAAAAAAAQAAAAAAAAAIZ3JvdXBfaWQAAAAGAAAAAQAAA+oAAAfQAAAACFRyYW5zZmVy",
        "AAAAAQAAAAAAAAAAAAAABUdyb3VwAAAAAAAABAAAAAAAAAACaWQAAAAAAAYAAAAAAAAAB21lbWJlcnMAAAAD6gAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAV0b2tlbgAAAAAAABM=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAACkdyb3VwQ291bnQAAAAAAAEAAAAAAAAABUdyb3VwAAAAAAAAAQAAAAYAAAABAAAAAAAAAAxFeHBlbnNlQ291bnQAAAABAAAABgAAAAEAAAAAAAAAB0V4cGVuc2UAAAAAAgAAAAYAAAAGAAAAAQAAAAAAAAAHQmFsYW5jZQAAAAACAAAABgAAABMAAAABAAAAAAAAAAxNZW1iZXJHcm91cHMAAAABAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAAB0V4cGVuc2UAAAAACQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAljb25maXJtZWQAAAAAAAPqAAAAEwAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAIZGlzcHV0ZWQAAAPqAAAAEwAAAAAAAAAIZ3JvdXBfaWQAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAMcGFydGljaXBhbnRzAAAD6gAAABMAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAGc2hhcmVzAAAAAAPqAAAACw==",
        "AAAAAQAAAAAAAAAAAAAACFRyYW5zZmVyAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    settle: this.txFromJSON<Array<Transfer>>,
        get_group: this.txFromJSON<Group>,
        get_expense: this.txFromJSON<Expense>,
        log_expense: this.txFromJSON<u64>,
        create_group: this.txFromJSON<u64>,
        confirm_expense: this.txFromJSON<null>,
        dispute_expense: this.txFromJSON<null>,
        get_member_groups: this.txFromJSON<Array<u64>>,
        get_group_expenses: this.txFromJSON<Array<Expense>>,
        get_member_balance: this.txFromJSON<i128>,
        preview_settlement: this.txFromJSON<Array<Transfer>>
  }
}