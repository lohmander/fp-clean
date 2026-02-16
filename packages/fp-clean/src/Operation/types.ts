import type { Result } from "../Result";
import type { OperationRuntime, OperationRuntimeSymbol } from "./runtime";

export declare const OperationTypeId: unique symbol;
export declare const YieldWrapId: unique symbol;

export const OperationBrand = Symbol.for("fp-clean/Operation");

export type YieldWrap<Ok, Err, Needs> = {
  readonly operation: Operation<Ok, Err, Needs>;
  readonly [YieldWrapId]?: { R: Needs; A: Ok; E: Err }; // phantom only, no runtime cost
};
export type AnyOperation = Operation<any, any, any>;
export type AnyYieldWrap = YieldWrap<any, any, any>;

export type OperationEnv = {
  readonly [OperationRuntimeSymbol]?: OperationRuntime;
};

export interface Operation<Ok, Err = never, Needs = unknown> {
  (r: Needs): () => AsyncGenerator<Result<Ok, Err>, void, any>;

  readonly [OperationTypeId]?: { R: Needs; A: Ok; E: Err };
  readonly [OperationBrand]?: true;

  [Symbol.iterator](): Generator<YieldWrap<Ok, Err, Needs>, Ok, any>;
}

export type OkOf<Op> = Op extends Operation<infer Ok, any, any> ? Ok : never;
export type ErrOf<Op> = Op extends Operation<any, infer Err, any> ? Err : never;
export type NeedsOf<Op> =
  Op extends Operation<any, any, infer Needs> ? Needs : never;
