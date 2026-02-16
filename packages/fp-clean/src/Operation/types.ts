import type { Result } from "../Result";
import type { OperationRuntime, OperationRuntimeSymbol } from "./runtime";

export declare const OperationTypeId: unique symbol;
export declare const YieldWrapId: unique symbol;

export const OperationBrand = Symbol.for("fp-clean/Operation");

export type YieldWrap<Ok, Err, Requirements> = {
  readonly operation: Operation<Ok, Err, Requirements>;
  readonly [YieldWrapId]?: { R: Requirements; A: Ok; E: Err }; // phantom only, no runtime cost
};
export type AnyOperation = Operation<any, any, any>;
export type AnyYieldWrap = YieldWrap<any, any, any>;

export type OperationEnv = {
  readonly [OperationRuntimeSymbol]?: OperationRuntime;
};

export interface Operation<Ok, Err = never, Requirements = unknown> {
  (r: Requirements): () => AsyncGenerator<Result<Ok, Err>, void, any>;

  readonly [OperationTypeId]?: { R: Requirements; A: Ok; E: Err };
  readonly [OperationBrand]?: true;

  [Symbol.iterator](): Generator<YieldWrap<Ok, Err, Requirements>, Ok, any>;
}

export type OkOf<Op> = Op extends Operation<infer Ok, any, any> ? Ok : never;
export type ErrOf<Op> = Op extends Operation<any, infer Err, any> ? Err : never;
export type RequirementsOf<Op> =
  Op extends Operation<any, any, infer Requirements> ? Requirements : never;
