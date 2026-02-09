import type { StreamResult } from "../StreamResult";
import type { OperationRuntime, OperationRuntimeSymbol } from "./runtime";

export declare const OperationTypeId: unique symbol;
export declare const YieldWrapId: unique symbol;

export const OperationBrand = Symbol.for("fp-clean/Operation");

export type YieldWrap<A, E, R> = {
  readonly operation: Operation<A, E, R>;
  readonly [YieldWrapId]?: { R: R; A: A; E: E }; // phantom only, no runtime cost
};
export type AnyOperation = Operation<any, any, any>;
export type AnyYieldWrap = YieldWrap<any, any, any>;

export type OperationEnv = {
  readonly [OperationRuntimeSymbol]?: OperationRuntime;
};

export interface Operation<A, E = never, R = {}> {
  (r: R): StreamResult<A, E>;
  readonly [OperationTypeId]?: { R: R; A: A; E: E };
  readonly [OperationBrand]?: true;

  [Symbol.iterator](): Generator<YieldWrap<A, E, R>, A, any>;
}

export type OkOf<T> = T extends Operation<infer A, any, any> ? A : never;
export type ErrOf<T> = T extends Operation<any, infer E, any> ? E : never;
export type RequirementsOf<T> =
  T extends Operation<any, any, infer R> ? R : never;
